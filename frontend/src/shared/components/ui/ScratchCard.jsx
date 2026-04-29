import React, { useRef, useEffect, useState } from 'react';

const ScratchCard = ({ 
    width = 300, 
    height = 150, 
    coverColor = '#D1D5DB', 
    coverImage,
    brushSize = 30, 
    finishPercent = 50, 
    onComplete, 
    children,
    isScratched = false
}) => {
    const canvasRef = useRef(null);
    const [isPressed, setIsPressed] = useState(false);
    const [completed, setCompleted] = useState(isScratched);

    useEffect(() => {
        if (isScratched) {
            setCompleted(true);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Fill with color
        ctx.fillStyle = coverColor;
        ctx.fillRect(0, 0, width, height);

        // Add some texture/pattern to look like a scratch card
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 2;
        for (let i = 0; i < width; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += 10) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }

        // Add text
        ctx.fillStyle = '#4B5563';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SCRATCH HERE', width / 2, height / 2 + 5);

        if (coverImage) {
            const img = new Image();
            img.src = coverImage;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
            };
        }
    }, [coverColor, coverImage, width, height, isScratched]);

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const scratch = (e) => {
        if (!isPressed || completed) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getMousePos(e);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
        ctx.fill();

        checkCompletion();
    };

    const checkCompletion = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] === 0) {
                transparentPixels++;
            }
        }

        const percent = (transparentPixels / (width * height)) * 100;
        if (percent >= finishPercent) {
            setCompleted(true);
            if (onComplete) onComplete();
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl shadow-inner bg-slate-50" style={{ width, height }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {children}
            </div>
            
            {!completed && (
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="absolute inset-0 cursor-crosshair touch-none"
                    onMouseDown={() => setIsPressed(true)}
                    onMouseUp={() => setIsPressed(false)}
                    onMouseOut={() => setIsPressed(false)}
                    onMouseMove={scratch}
                    onTouchStart={() => setIsPressed(true)}
                    onTouchEnd={() => setIsPressed(false)}
                    onTouchMove={scratch}
                />
            )}
        </div>
    );
};

export default ScratchCard;
