import React, { useEffect, useRef } from 'react';

interface DataScreeningAnimationProps {
  isActive: boolean;
  darkMode: boolean;
}

const DataScreeningAnimation: React.FC<DataScreeningAnimationProps> = ({ isActive, darkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Animation parameters
    const particles: Particle[] = [];
    const maxParticles = 30;
    const particleColors = darkMode ? 
      ['#4287f5', '#42a1f5', '#42f5e3', '#0057ff'] : 
      ['#0057ff', '#0066cc', '#0099ff', '#00c3ff'];
    
    // Define multiple insight points across the canvas
    const insightPoints = [
      canvas.width * 0.25, // First insight point at 1/4
      canvas.width * 0.5,  // Second insight point at 1/2
      canvas.width * 0.75  // Third insight point at 3/4
    ];
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      text: string;
      color: string;
      transformed: boolean;
      explodeProgress: number;
      explodeSpeed: number;
      explodeRadius: number;
      transformPoint: number;
      
      constructor() {
        this.x = -50; // Start off-screen
        this.y = Math.random() * canvas.height;
        this.size = 2 + Math.random() * 3;
        this.speedX = 1 + Math.random() * 2;
        this.text = generateRandomAddress();
        this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
        this.transformed = false;
        this.explodeProgress = 0;
        this.explodeSpeed = 0.02 + Math.random() * 0.03;
        this.explodeRadius = 30 + Math.random() * 20;
        
        // Randomly assign one of the insight points for this particle
        this.transformPoint = insightPoints[Math.floor(Math.random() * insightPoints.length)];
      }
      
      update() {
        if (!this.transformed) {
          this.x += this.speedX;
          
          // Check if particle hits its assigned insight point
          if (this.x > this.transformPoint - 10 && this.x < this.transformPoint + 10) {
            this.transformed = true;
          }
        } else {
          // Explosion animation
          this.explodeProgress += this.explodeSpeed;
          if (this.explodeProgress > 1) {
            // Reset particle
            this.x = -50;
            this.y = Math.random() * canvas.height;
            this.transformed = false;
            this.explodeProgress = 0;
            this.text = generateRandomAddress();
            // Reassign a potentially different insight point
            this.transformPoint = insightPoints[Math.floor(Math.random() * insightPoints.length)];
          }
        }
      }
      
      draw() {
        if (!ctx) return;
        
        if (!this.transformed) {
          // Draw moving text particle
          ctx.fillStyle = this.color;
          ctx.font = `${9 + this.size}px monospace`;
          ctx.fillText(this.text, this.x, this.y);
        } else {
          // Draw explosion/transformation effect
          const alpha = 1 - this.explodeProgress;
          ctx.globalAlpha = alpha;
          
          // Draw geometric shapes representing insights
          ctx.fillStyle = this.color;
          
          // Randomly choose a shape for each particle
          const shapeType = Math.floor(this.y * 3) % 3;
          
          if (shapeType === 0) {
            // Diamond shape
            ctx.beginPath();
            const radius = this.explodeRadius * this.explodeProgress;
            ctx.moveTo(this.transformPoint, this.y - radius);
            ctx.lineTo(this.transformPoint + radius, this.y);
            ctx.lineTo(this.transformPoint, this.y + radius);
            ctx.lineTo(this.transformPoint - radius, this.y);
            ctx.closePath();
            ctx.fill();
          } else if (shapeType === 1) {
            // Circle
            ctx.beginPath();
            ctx.arc(this.transformPoint, this.y, this.explodeRadius * this.explodeProgress, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Square with rotation
            ctx.save();
            ctx.translate(this.transformPoint, this.y);
            ctx.rotate(this.explodeProgress * Math.PI);
            const size = this.explodeRadius * this.explodeProgress;
            ctx.fillRect(-size/2, -size/2, size, size);
            ctx.restore();
          }
          
          ctx.globalAlpha = 1;
        }
      }
    }
    
    // Generate random addresses (wallet-like or ENS-like)
    function generateRandomAddress() {
      const types = [
        // 0x style
        () => {
          const chars = '0123456789abcdef';
          let addr = '0x';
          for (let i = 0; i < 8; i++) {
            addr += chars[Math.floor(Math.random() * chars.length)];
          }
          return addr + '...';
        },
        // .eth style
        () => {
          const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          let name = '';
          const length = 3 + Math.floor(Math.random() * 8);
          for (let i = 0; i < length; i++) {
            name += chars[Math.floor(Math.random() * chars.length)];
          }
          return name + '.eth';
        }
      ];
      
      return types[Math.floor(Math.random() * types.length)]();
    }
    
    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
      // Stagger initial positions
      particles[i].x = -200 - (i * 100 * Math.random());
    }
    
    // Animation loop
    let animationId: number;
    function animate() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(245, 245, 250, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isActive, darkMode]);
  
  return (
    <div className="w-full h-32 my-4 overflow-hidden rounded-lg">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ 
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out' 
        }}
      />
    </div>
  );
};

export default DataScreeningAnimation;