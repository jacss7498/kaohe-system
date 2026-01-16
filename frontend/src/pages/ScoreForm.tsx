import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import api from '../utils/api';
import Modal from '../components/Modal';

interface Target {
  id: number;
  name: string;
  type: string;
  score: number | null;
  remark: string | null;
  signature: string | null;
  submitted: boolean;
}

interface TaskData {
  task: {
    id: number;
    name: string;
    type: string;
  };
  targets: Target[];
  isSubmitted: boolean;
}

export default function ScoreForm() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TaskData | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [signature, setSignature] = useState('');
  const [signatureCanvas, setSignatureCanvas] = useState<SignatureCanvas | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('error');
  const signatureContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [taskId]);

  const fetchData = async () => {
    try {
      const response = await api.get(`/scores/task/${taskId}`);
      setData(response.data);
      
      // 初始化表单数据
      const initialScores: Record<number, number> = {};
      const initialRemarks: Record<number, string> = {};
      response.data.targets.forEach((target: Target) => {
        if (target.score !== null) {
          initialScores[target.id] = target.score;
        }
        if (target.remark) {
          initialRemarks[target.id] = target.remark;
        }
      });
      setScores(initialScores);
      setRemarks(initialRemarks);
      
      if (response.data.isSubmitted) {
        setSignature(response.data.targets[0]?.signature || '');
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (targetId: number, value: string) => {
    // 允许空字符串（用于删除）
    if (value === '') {
      const newScores = { ...scores };
      delete newScores[targetId];
      setScores(newScores);
      setErrors({});
      return;
    }
    
    // 尝试解析为数字
    const numValue = parseInt(value);
    
    // 如果输入不是有效数字，不更新（但允许继续输入）
    if (isNaN(numValue)) {
      return;
    }
    
    // 验证范围
    if (numValue < 0 || numValue > 100) {
      return;
    }
    
    setScores({ ...scores, [targetId]: numValue });
    setErrors({});
  };

  const handleRemarkChange = (targetId: number, value: string) => {
    setRemarks({ ...remarks, [targetId]: value });
    setErrors({});
  };

  const validateForm = (): Record<string, string> | null => {
    const newErrors: Record<string, string> = {};

    if (!data) return null;

    // 检查所有评分是否填写
    data.targets.forEach((target) => {
      if (scores[target.id] === undefined || scores[target.id] === null) {
        newErrors[`score_${target.id}`] = '请填写评分';
      }
    });

    // 检查特殊说明
    data.targets.forEach((target) => {
      const score = scores[target.id];
      if (score !== undefined && (score === 100 || score < 60)) {
        if (!remarks[target.id] || remarks[target.id].trim() === '') {
          newErrors[`remark_${target.id}`] = `对${target.name}评分${score}分，必须填写说明理由`;
        }
      }
    });

    // 检查名额限制
    const excellentScores = data.targets.filter(
      (t) => scores[t.id] !== undefined && scores[t.id] >= 90 && scores[t.id] <= 100
    );
    const goodScores = data.targets.filter(
      (t) => scores[t.id] !== undefined && scores[t.id] >= 80 && scores[t.id] < 90
    );

    if (data.task.type === 'department') {
      if (excellentScores.length > 1) {
        newErrors.general = '优秀科室仅限评选1名，请调整评分';
      }
      if (goodScores.length > 2) {
        newErrors.general = '良好科室仅限评选2名，请调整评分';
      }
    } else {
      if (excellentScores.length > 2) {
        newErrors.general = '优秀中队仅限评选2名，请调整评分';
      }
      if (goodScores.length > 5) {
        newErrors.general = '良好中队仅限评选5名，请调整评分';
      }
    }

    // 检查签名
    if (!signature || signature.trim() === '') {
      newErrors.signature = '请进行电子签名';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? null : newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();

    if (validationErrors !== null || !data) {
      // 显示验证错误对话框，分类显示错误信息
      const errorMessages: string[] = ['表单填写有误，请检查以下问题：\n'];


      // 使用刚验证得到的错误对象，而不是state中的errors
      const currentErrors = validationErrors || {};
      // 1. 名额限制错误（优先显示）
      if (currentErrors.general) {
        errorMessages.push('【名额限制】');
        errorMessages.push('  • ' + currentErrors.general);
        errorMessages.push('');
      }

      // 2. 评分缺失错误
      const scoreErrors = Object.keys(currentErrors).filter(key => key.startsWith('score_'));
      if (scoreErrors.length > 0) {
        errorMessages.push('【评分缺失】');
        scoreErrors.forEach((key) => {
          const targetId = parseInt(key.replace('score_', ''));
          const target = data?.targets.find(t => t.id === targetId);
          if (target) {
            errorMessages.push(`  • ${target.name}：${currentErrors[key]}`);
          }
        });
        errorMessages.push('');
      }

      // 3. 说明理由缺失错误
      const remarkErrors = Object.keys(currentErrors).filter(key => key.startsWith('remark_'));
      if (remarkErrors.length > 0) {
        errorMessages.push('【说明理由缺失】');
        remarkErrors.forEach((key) => {
          errorMessages.push('  • ' + currentErrors[key]);
        });
        errorMessages.push('');
      }

      // 4. 签名错误
      if (currentErrors.signature) {
        errorMessages.push('【电子签名】');
        errorMessages.push('  • ' + currentErrors.signature);
      }

      setModalMessage(errorMessages.join('\n').trim() || '请检查表单填写是否正确');
      setModalType('error');
      setShowModal(true);
      return;
    }

    setSubmitting(true);

    try {
      const scoreData = data.targets.map((target) => ({
        targetId: target.id,
        score: scores[target.id],
        remark: remarks[target.id] || null,
      }));

      await api.post('/scores/submit', {
        taskId: parseInt(taskId!),
        scores: scoreData,
        signature: signature,
      });

      setModalMessage('评分提交成功！');
      setModalType('success');
      setShowModal(true);
      
      // 成功后跳转，传递刷新标志和任务ID
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            refresh: true,
            taskId: parseInt(taskId!),
            timestamp: Date.now() // 添加时间戳确保每次都是新的刷新
          } 
        });
      }, 1500);
    } catch (error: any) {
      setModalMessage(error.response?.data?.error || '提交失败，请重试');
      setModalType('error');
      setShowModal(true);
      setSubmitting(false);
    }
  };

  const handleClearSignature = () => {
    signatureCanvas?.clear();
    setSignature('');
  };

  const handleSignatureEnd = () => {
    if (signatureCanvas) {
      setSignature(signatureCanvas.toDataURL());
    }
  };

  // 初始化签名画布，修复坐标问题
  useEffect(() => {
    if (signatureCanvas && signatureContainerRef.current) {
      const canvas = signatureCanvas.getCanvas();
      const container = signatureContainerRef.current;
      
      const resizeCanvas = () => {
        if (!container || !canvas) return;
        
        // 获取容器的实际显示尺寸
        const rect = container.getBoundingClientRect();
        const displayWidth = Math.floor(rect.width);
        const displayHeight = 200;
        
        // 获取设备像素比（处理高DPI屏幕）
        const dpr = window.devicePixelRatio || 1;
        
        // 设置canvas的实际像素尺寸（考虑设备像素比）
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        // 设置canvas的CSS显示尺寸
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        // 缩放画布上下文以适应设备像素比
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          // 设置线条样式
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      };
      
      // 延迟执行以确保DOM已渲染
      const timer = setTimeout(resizeCanvas, 50);
      
      // 监听窗口大小变化
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [signatureCanvas, data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">加载失败</div>
      </div>
    );
  }

  if (data.isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← 返回
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">评分已提交</h2>
            <p className="text-gray-600 mb-6">您已完成本次评分任务</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回任务列表
            </button>
          </div>
        </main>
      </div>
    );
  }

  const rules = data.task.type === 'department' 
    ? { excellent: 1, good: 2 }
    : { excellent: 2, good: 5 };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← 返回
            </button>
            <h1 className="text-lg font-bold text-gray-800">{data.task.name}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 评分规则提示 */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">评分规则</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 评分范围：0-100分（整数）</li>
            <li>• 优秀（90-100分）：限选{rules.excellent}名</li>
            <li>• 良好（80-89分）：限选{rules.good}名</li>
            <li>• 一般（60-79分）：不限数量</li>
            <li>• 其他（0-59分）：不限数量</li>
            <li>• 评分100分或低于60分必须填写说明理由</li>
          </ul>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {errors.general}
          </div>
        )}

        {/* 评分表单 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">评分表</h2>
            <div className="space-y-4">
              {data.targets.map((target) => {
                const score = scores[target.id];
                const remark = remarks[target.id] || '';
                const needsRemark = score !== undefined && (score === 100 || score < 60);
                const scoreError = errors[`score_${target.id}`];
                const remarkError = errors[`remark_${target.id}`];

                return (
                  <div key={target.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-gray-700">
                        {target.name}
                      </label>
                      {score !== undefined && (
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            score >= 90
                              ? 'bg-green-100 text-green-800'
                              : score >= 80
                              ? 'bg-blue-100 text-blue-800'
                              : score >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {score >= 90
                            ? '优秀'
                            : score >= 80
                            ? '良好'
                            : score >= 60
                            ? '一般'
                            : '其他'}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={score !== undefined && score !== null ? score.toString() : ''}
                          onChange={(e) => handleScoreChange(target.id, e.target.value)}
                          onKeyDown={(e) => {
                            // 允许删除键、退格键、Tab键等
                            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                              return;
                            }
                            // 只允许数字
                            if (!/^[0-9]$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg ${
                            scoreError ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0-100"
                        />
                        {scoreError && (
                          <p className="text-red-500 text-sm mt-1">{scoreError}</p>
                        )}
                      </div>
                    </div>
                    {needsRemark && (
                      <div className="mt-2">
                        <textarea
                          value={remark}
                          onChange={(e) => handleRemarkChange(target.id, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg ${
                            remarkError ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder={`请说明对${target.name}评分${score}分的理由`}
                          rows={2}
                        />
                        {remarkError && (
                          <p className="text-red-500 text-sm mt-1">{remarkError}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 电子签名 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">电子签名</h2>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white overflow-hidden">
              <div 
                ref={signatureContainerRef}
                className="w-full" 
                style={{ 
                  touchAction: 'none', 
                  position: 'relative',
                  width: '100%',
                  height: '200px'
                }}
              >
                <SignatureCanvas
                  ref={(ref) => setSignatureCanvas(ref)}
                  canvasProps={{
                    className: 'signature-canvas',
                    style: { 
                      width: '100%', 
                      height: '200px',
                      display: 'block',
                      touchAction: 'none',
                    },
                  }}
                  onEnd={handleSignatureEnd}
                />
              </div>
            </div>
            {signature && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">签名预览：</p>
                <img src={signature} alt="签名" className="border rounded max-h-20" />
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleClearSignature}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                清除签名
              </button>
            </div>
            {errors.signature && (
              <p className="text-red-500 text-sm mt-2">{errors.signature}</p>
            )}
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '提交中...' : '提交评分'}
          </button>
          <p className="text-sm text-gray-600 text-center mt-4">
            提交后无法修改，请确认无误后再提交
          </p>
        </div>
      </main>

      {/* 对话框 */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          if (modalType === 'success') {
            navigate('/dashboard');
          }
        }}
        title={modalType === 'success' ? '提交成功' : '提示'}
        showCloseButton={true}
      >
        <div className={`py-4 ${modalType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          <p className="whitespace-pre-line text-left">{modalMessage}</p>
        </div>
      </Modal>
    </div>
  );
}

