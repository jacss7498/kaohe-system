import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

// 使用归一化坐标（0-1之间），这样无论画布大小如何改变，签名都能正确显示
interface Point {
  x: number; // 归一化 x 坐标 (0-1)
  y: number; // 归一化 y 坐标 (0-1)
  time: number;
}

interface Stroke {
  points: Point[];
}

interface AdvancedSignatureProps {
  onSignatureChange?: (signature: string) => void;
  value?: string;
}

export interface AdvancedSignatureHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

const AdvancedSignature = forwardRef<AdvancedSignatureHandle, AdvancedSignatureProps>(
  ({ onSignatureChange, value }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [initialized, setInitialized] = useState(false);

    // 初始化和调整画布大小
    const setupCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // 设置显示尺寸
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // 设置实际画布尺寸（考虑设备像素比）
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;

      // 获取上下文并缩放
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        // 重绘所有内容
        redrawAll(ctx, displayWidth, displayHeight);
      }

      if (!initialized) {
        setInitialized(true);
      }
    };

    // 重绘所有笔画和辅助线
    const redrawAll = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 绘制中线辅助线
      ctx.save();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.restore();

      // 绘制所有已保存的笔画（将归一化坐标转换为实际坐标）
      strokes.forEach((stroke) => {
        drawStroke(ctx, stroke.points, width, height);
      });
    };

    // 绘制单个笔画
    const drawStroke = (
      ctx: CanvasRenderingContext2D,
      points: Point[],
      width: number,
      height: number
    ) => {
      if (points.length < 2) return;

      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currPoint = points[i];

        // 将归一化坐标转换为实际坐标
        const prevX = prevPoint.x * width;
        const prevY = prevPoint.y * height;
        const currX = currPoint.x * width;
        const currY = currPoint.y * height;

        // 根据速度计算笔触粗细
        const distance = Math.sqrt(
          Math.pow(currX - prevX, 2) + Math.pow(currY - prevY, 2)
        );
        const timeDiff = currPoint.time - prevPoint.time;
        const speed = timeDiff > 0 ? distance / timeDiff : 0;

        // 速度越快，线条越细（模拟真实书写）
        const baseWidth = isFullscreen ? 3.5 : 2.5;
        const lineWidth = Math.max(1.5, Math.min(baseWidth, baseWidth - speed * 0.008));

        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.stroke();
      }

      ctx.restore();
    };

    // 初始化画布
    useEffect(() => {
      setupCanvas();

      const handleResize = () => {
        setupCanvas();
      };

      window.addEventListener('resize', handleResize);
      const orientationHandler = () => {
        setTimeout(setupCanvas, 100);
      };
      const orientation = screen.orientation as any;
      if (orientation) {
        orientation.addEventListener?.('change', orientationHandler);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        if (orientation) {
          orientation.removeEventListener?.('change', orientationHandler);
        }
      };
    }, [strokes, isFullscreen]); // 依赖 strokes 和 isFullscreen，确保切换时重绘

    // 如果有初始值，加载它
    useEffect(() => {
      if (value && canvasRef.current && initialized) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, rect.width, rect.height);
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
            setHasSignature(true);
          }
        };
        img.src = value;
      }
    }, [value, initialized]);

    // 从事件中获取归一化坐标点
    const getPointFromEvent = (e: React.TouchEvent | React.MouseEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, time: Date.now() };

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        if (e.touches.length === 0) return { x: 0, y: 0, time: Date.now() };
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // 计算相对于画布的坐标，然后归一化到 0-1 范围
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      return {
        x: relativeX / rect.width,  // 归一化 x
        y: relativeY / rect.height, // 归一化 y
        time: Date.now(),
      };
    };

    // 开始绘制
    const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const point = getPointFromEvent(e);
      setIsDrawing(true);
      setCurrentStroke([point]);
      setHasSignature(true);
    };

    // 移动绘制
    const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      e.stopPropagation();

      const point = getPointFromEvent(e);
      const newStroke = [...currentStroke, point];
      setCurrentStroke(newStroke);

      // 实时绘制当前笔画
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const rect = canvas?.getBoundingClientRect();
      if (ctx && rect && currentStroke.length > 0) {
        const lastPoint = currentStroke[currentStroke.length - 1];
        drawStroke(ctx, [lastPoint, point], rect.width, rect.height);
      }
    };

    // 结束绘制
    const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      e.stopPropagation();

      setIsDrawing(false);

      if (currentStroke.length > 0) {
        const newStrokes = [...strokes, { points: currentStroke }];
        setStrokes(newStrokes);
        setCurrentStroke([]);

        // 通知父组件签名已更改
        if (onSignatureChange && canvasRef.current) {
          setTimeout(() => {
            const dataURL = canvasRef.current?.toDataURL('image/png');
            if (dataURL) {
              onSignatureChange(dataURL);
            }
          }, 10);
        }
      }
    };

    // 清除签名
    const clear = () => {
      setStrokes([]);
      setCurrentStroke([]);
      setHasSignature(false);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const rect = canvas?.getBoundingClientRect();
      if (ctx && rect) {
        redrawAll(ctx, rect.width, rect.height);
      }

      if (onSignatureChange) {
        onSignatureChange('');
      }
    };

    // 撤销上一笔
    const undo = () => {
      if (strokes.length === 0) return;

      const newStrokes = strokes.slice(0, -1);
      setStrokes(newStrokes);
      setHasSignature(newStrokes.length > 0);

      // 通知父组件
      if (onSignatureChange && canvasRef.current) {
        setTimeout(() => {
          const dataURL = canvasRef.current?.toDataURL('image/png') || '';
          onSignatureChange(dataURL);
        }, 10);
      }
    };

    // 切换全屏
    const toggleFullscreen = async () => {
      if (!containerRef.current) return;

      if (!isFullscreen) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (e) {
          console.error('Fullscreen request failed:', e);
        }
      } else {
        try {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } catch (e) {
          console.error('Exit fullscreen failed:', e);
        }
      }
    };

    // 监听全屏变化
    useEffect(() => {
      const handleFullscreenChange = () => {
        const isNowFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isNowFullscreen);
        // 全屏状态变化时重新设置画布（会触发上面的 useEffect 重绘）
        setTimeout(setupCanvas, 100);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }, []);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      clear,
      isEmpty: () => !hasSignature,
      toDataURL: () => canvasRef.current?.toDataURL('image/png') || '',
    }));

    return (
      <div
        ref={containerRef}
        className={`advanced-signature-container ${isFullscreen ? 'fullscreen' : ''}`}
      >
        <div className="signature-canvas-wrapper">
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
            className="signature-canvas-advanced"
          />
          {!hasSignature && (
            <div className="signature-placeholder">
              请在此处签名
            </div>
          )}
        </div>

        <div className="signature-controls">
          <button
            type="button"
            onClick={undo}
            disabled={strokes.length === 0}
            className="signature-btn signature-btn-secondary"
            title="撤销上一笔"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            撤销
          </button>

          <button
            type="button"
            onClick={clear}
            className="signature-btn signature-btn-secondary"
            title="清除全部"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清除
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="signature-btn signature-btn-primary"
            title={isFullscreen ? '退出全屏' : '全屏签名'}
          >
            {isFullscreen ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                退出全屏
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                全屏签名
              </>
            )}
          </button>
        </div>

        {isFullscreen && (
          <div className="fullscreen-hint">
            <p className="text-white text-lg mb-2">💡 建议将手机横屏以获得更大的签名空间</p>
            <p className="text-white/80 text-sm">签名完成后点击"退出全屏"按钮</p>
          </div>
        )}
      </div>
    );
  }
);

AdvancedSignature.displayName = 'AdvancedSignature';

export default AdvancedSignature;
