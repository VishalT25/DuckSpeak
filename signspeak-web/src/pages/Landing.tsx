import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { animate, createScope, spring, stagger } from 'animejs';

const Landing = () => {
  const heroRef = React.useRef<HTMLDivElement>(null);
  const featuresRef = React.useRef<HTMLDivElement>(null);
  const heroScopeRef = React.useRef<any>(null);

  // Hero animations
  useEffect(() => {
    if (heroRef.current) {
      heroScopeRef.current = createScope({ root: heroRef.current }).add(() => {
        animate('.hero-logo', {
          opacity: [0, 1],
          scale: [0.8, 1],
          rotate: [10, 0],
          duration: 1200,
          ease: spring({ bounce: 0.4 }),
        });

        animate('.hero-title', {
          opacity: [0, 1],
          translateY: [60, 0],
          duration: 1000,
          delay: 200,
          ease: spring({ bounce: 0.3 }),
        });

        animate('.hero-subtitle', {
          opacity: [0, 1],
          translateY: [40, 0],
          duration: 800,
          delay: 400,
          ease: spring({ bounce: 0.3 }),
        });

        animate('.hero-description', {
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 800,
          delay: 600,
          ease: spring({ bounce: 0.3 }),
        });

        animate('.hero-cta', {
          opacity: [0, 1],
          translateY: [20, 0],
          scale: [0.9, 1],
          duration: 600,
          delay: stagger(100, { start: 800 }),
          ease: spring({ bounce: 0.4 }),
        });
      });

      return () => heroScopeRef.current?.revert();
    }
  }, []);

  // Features animations
  useEffect(() => {
    if (featuresRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && featuresRef.current) {
              animate('.feature-card', {
                opacity: [0, 1],
                translateY: [60, 0],
                scale: [0.9, 1],
                rotate: [5, 0],
                duration: 800,
                delay: stagger(150),
                ease: spring({ bounce: 0.3 }),
              });
            }
          });
        },
        { threshold: 0.2 }
      );

      if (featuresRef.current) {
        observer.observe(featuresRef.current);
      }

      return () => observer.disconnect();
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #0a1628 100%)' }}>
      {/* Global Navigation Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(10, 14, 26, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              transition: 'opacity 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <img src="/logo.svg" alt="DuckSpeak Logo" style={{ width: '2.5rem', height: '2.5rem' }} />
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#ffffff',
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              }}
            >
              DuckSpeak
            </span>
          </Link>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a
              href="#features"
              style={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              Features
            </a>
            <a
              href="#training"
              style={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              Training
            </a>
            <a
              href="#how-it-works"
              style={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              How It Works
            </a>
            <Link
              to="/video-call"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                color: '#ffffff',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
              }}
            >
              Start Call
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '6rem 1.5rem 0 1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at top, rgba(30,58,138,0.15), transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '5rem',
            position: 'relative',
            zIndex: 10,
            width: '100%',
          }}
        >
          {/* Logo */}
          <div
            className="hero-logo"
            style={{
              flexShrink: 0,
              lineHeight: 1,
              opacity: 0,
            }}
          >
            <img src="/logo.svg" alt="DuckSpeak Logo" style={{ width: '20rem', height: '20rem' }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h1
                className="hero-title"
                style={{
                  fontSize: '4.5rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  margin: 0,
                  opacity: 0,
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                }}
              >
                Real-Time ASL Recognition
              </h1>

              <h2
                className="hero-subtitle"
                style={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                  opacity: 0,
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                }}
              >
                Breaking Communication Barriers
              </h2>

              <p
                className="hero-description"
                style={{
                  fontSize: '1.5rem',
                  color: '#cbd5e1',
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: '700px',
                  opacity: 0,
                }}
              >
                DuckSpeak empowers deaf and hard-of-hearing individuals with AI-powered ASL translation in real-time video calls.
              </p>
            </div>

            {/* CTA */}
            <div style={{ marginTop: '1rem' }}>
              <Link
                to="/video-call"
                className="hero-cta"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.25rem 2.5rem',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  borderRadius: '1rem',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  textDecoration: 'none',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  opacity: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 48px rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.3)';
                }}
              >
                🎥 Start Video Call
              </Link>
            </div>

            {/* Feature badges */}
            <div className="hero-cta" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', opacity: 0 }}>
              <span
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(30, 58, 138, 0.3)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '9999px',
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                ✨ AI-Powered
              </span>
              <span
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(30, 58, 138, 0.3)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '9999px',
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                🎤 Speech-to-Text
              </span>
              <span
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(30, 58, 138, 0.3)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '9999px',
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                🤟 ASL Translation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={featuresRef}
        style={{
          padding: '6rem 1.5rem',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              textAlign: 'center',
              color: '#ffffff',
              marginBottom: '4rem',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            }}
          >
            Powerful Features
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Feature Cards */}
            {[
              { icon: '🎥', title: 'Real-Time Video', desc: 'Crystal-clear video calls with seamless LiveKit integration for smooth communication.' },
              { icon: '🤟', title: 'ASL Recognition', desc: 'Train custom models with MediaPipe and TensorFlow.js for accurate sign language detection.' },
              { icon: '💬', title: 'Speech-to-Text', desc: 'Automatic speech recognition converts spoken words to text captions instantly.' },
              { icon: '📝', title: 'Live Captions', desc: 'Real-time captioning displays translations for both participants simultaneously.' },
              { icon: '🎨', title: 'Custom Training', desc: 'Collect your own gesture data and train personalized ASL recognition models.' },
              { icon: '🔒', title: 'Privacy First', desc: 'All models run locally in your browser. Your data never leaves your device.' },
            ].map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                style={{
                  padding: '2.5rem',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '1.5rem',
                  opacity: 0,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '1rem',
                    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Training Section */}
      <section
        id="training"
        style={{
          padding: '6rem 1.5rem',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'rgba(30, 58, 138, 0.3)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '9999px',
                color: '#60a5fa',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '1.5rem',
              }}
            >
              ✨ For Experienced Users
            </div>

            <h2
              style={{
                fontSize: '3.5rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '1.5rem',
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              }}
            >
              Train Custom ASL Models
            </h2>

            <p
              style={{
                fontSize: '1.25rem',
                color: '#cbd5e1',
                lineHeight: 1.7,
                maxWidth: '800px',
                margin: '0 auto',
              }}
            >
              Take full control with our advanced training interface. Collect gesture data, train personalized models, and achieve accurate recognition tailored to your signing style.
            </p>
          </div>

          {/* Training Feature Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
              marginBottom: '3rem',
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                padding: '2.5rem',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '1.5rem',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '1rem',
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                }}
              >
                Data Collection
              </h3>
              <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Record hundreds of samples for each gesture with real-time hand tracking visualization powered by MediaPipe.
              </p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                padding: '2.5rem',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '1.5rem',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧠</div>
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '1rem',
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                }}
              >
                Neural Network Training
              </h3>
              <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Train TensorFlow.js models directly in your browser with configurable epochs, batch sizes, and learning rates.
              </p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                padding: '2.5rem',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '1.5rem',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '1rem',
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                }}
              >
                Privacy First
              </h3>
              <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                All training data and models are saved locally in IndexedDB. Your data never leaves your device.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/collect-train"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem 2.5rem',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                color: '#ffffff',
                borderRadius: '1rem',
                fontWeight: 700,
                fontSize: '1.125rem',
                textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.3)';
              }}
            >
              🤖 Open Training Studio
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: '6rem 1.5rem', background: 'rgba(30, 58, 138, 0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              textAlign: 'center',
              color: '#ffffff',
              marginBottom: '4rem',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            }}
          >
            How It Works
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {[
              { num: '1', title: 'Train Your Model', desc: 'Use the Collect & Train tab to record gestures and train a personalized ASL recognition model.' },
              { num: '2', title: 'Start a Video Call', desc: 'Create or join a room to start your video call with real-time communication.' },
              { num: '3', title: 'Communicate Freely', desc: 'Enable ASL or speech mode to see real-time translations appear as captions for both participants.' },
            ].map((step, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: '5rem',
                    height: '5rem',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
                  }}
                >
                  {step.num}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: '0.5rem',
                      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '1.25rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(59, 130, 246, 0.2)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src="/logo.svg" alt="DuckSpeak Logo" style={{ width: '3rem', height: '3rem' }} />
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                }}
              >
                DuckSpeak
              </span>
            </div>

            <div style={{ display: 'flex', gap: '2rem', color: '#94a3b8', fontSize: '1rem' }}>
              <Link
                to="/video-call"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                Video Call
              </Link>
              <Link
                to="/collect-train"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                Collect & Train
              </Link>
              <a
                href="https://www.github.com/VishalT25/DuckSpeak"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>

            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>© 2025 DuckSpeak. Breaking barriers with AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
