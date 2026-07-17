'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import { Button } from "@/components/ui/button";
import {
  QrCode,
  MapPin,
  MessageCircle,
  CheckCircle,
  Smartphone,
  Battery,
  Zap,
  ArrowRight,
  RefreshCw,
  Send,
  Clock
} from "lucide-react";

// Types
type Step = 'intro' | 'scan' | 'location' | 'whatsapp' | 'success';

// Demo Page Component
export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [isAnimating, setIsAnimating] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [locationShared, setLocationShared] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Ahmed',
    phone: '+221 77 123 45 67'
  });
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer
  useEffect(() => {
    if (currentStep !== 'intro' && currentStep !== 'success') {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep]);

  // Handle Scan
  const handleScan = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setScanComplete(true);
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep('location');
      }, 1500);
    }, 2000);
  };

  // Handle Location
  const handleLocation = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setLocationShared(true);
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep('whatsapp');
      }, 1500);
    }, 2000);
  };

  // Handle WhatsApp
  const handleWhatsApp = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setMessageSent(true);
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep('success');
      }, 1000);
    }, 1500);
  };

  // Reset Demo
  const resetDemo = () => {
    setCurrentStep('intro');
    setScanComplete(false);
    setLocationShared(false);
    setMessageSent(false);
    setElapsedTime(0);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer display for header
  const headerExtra = currentStep !== 'intro' && currentStep !== 'success' ? (
    <div className="flex items-center gap-2 bg-[#0d1220] px-4 py-2 rounded-full border border-[#1a2238]">
      <Clock className="w-4 h-4 text-[#10B981]" />
      <span className="text-white font-mono">{formatTime(elapsedTime)}</span>
    </div>
  ) : null;

  return (
    <PublicLayout paddingTop="pt-20">
      {/* Timer Display */}
      {headerExtra && (
        <div className="fixed top-20 right-4 z-40">
          {headerExtra}
        </div>
      )}

      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 via-transparent to-[#059669]/10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#10B981]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#059669]/20 rounded-full blur-3xl animate-pulse" />

        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* INTRO STEP */}
          {currentStep === 'intro' && (
            <div className="text-center py-16 animate-fade-in">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="px-4 py-2 bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981] text-sm rounded-full font-medium animate-pulse">
                  ✨ Découverte interactive
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">
                  Essayez QRTags
                </span>
                <br />
                <span className="text-white">en 60 secondes</span>
              </h1>

              <p className="text-[#a0a8b8] max-w-2xl mx-auto mb-8 text-lg">
                Aucun compte, aucune application. Juste un QR code… et magie.
                Découvrez comment protéger vos objets en moins d&apos;une minute.
              </p>

              {/* Features Pills */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="flex items-center gap-2 bg-[#0d1220] px-4 py-2 rounded-full border border-[#1a2238]">
                  <Smartphone className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#a0a8b8] text-sm">Sans application</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0d1220] px-4 py-2 rounded-full border border-[#1a2238]">
                  <Battery className="w-4 h-4 text-[#059669]" />
                  <span className="text-[#a0a8b8] text-sm">Sans batterie</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0d1220] px-4 py-2 rounded-full border border-[#1a2238]">
                  <Zap className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#a0a8b8] text-sm">30 secondes</span>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep('scan')}
                className="bg-[#10B981] text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-[#e01e5a] transition-all transform hover:scale-105 shadow-lg shadow-[#10B981]/30 inline-flex items-center gap-3"
              >
                <span className="text-2xl">▶️</span>
                Démarrer la démo
              </button>

              <p className="mt-6 text-[#a0a8b8] text-sm">
                Simulation interactive • Aucune donnée réelle requise
              </p>
            </div>
          )}

          {/* SCAN STEP */}
          {currentStep === 'scan' && (
            <div className="text-center py-8 animate-fade-in">
              {/* Progress */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all ${
                      step === 1 ? 'bg-[#10B981] w-8' : 'bg-[#1a2238]'
                    }`}
                  />
                ))}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Étape 1 : Scannez le QR
              </h2>
              <p className="text-[#a0a8b8] mb-8">
                Imaginez que vous scannez le QR code sur votre objet
              </p>

              {/* QR Code Display */}
              <div className="flex justify-center mb-8">
                <div className={`relative ${isAnimating ? 'animate-pulse' : ''}`}>
                  {/* Glow */}
                  <div className="absolute inset-0 bg-[#10B981]/30 blur-3xl rounded-full" />

                  {/* QR Card */}
                  <div className={`relative bg-[#0d1220] rounded-3xl p-8 border-2 transition-all duration-500 ${
                    scanComplete ? 'border-[#1e3a2e] bg-[#1e3a2e]/20' : 'border-[#10B981]/50'
                  }`}>
                    <div className="w-56 h-56 bg-white rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Scan Animation */}
                      {isAnimating && (
                        <div className="absolute inset-0 bg-[#10B981]/20 flex items-center justify-center">
                          <div className="w-full h-1 bg-[#10B981] animate-scan" />
                        </div>
                      )}

                      {scanComplete ? (
                        <div className="flex flex-col items-center animate-bounce">
                          <CheckCircle className="w-24 h-24 text-[#1e3a2e]" />
                          <span className="text-[#1e3a2e] font-bold mt-2">Activé !</span>
                        </div>
                      ) : (
                        <>
                          <QrCode className="w-36 h-36 text-[#080c1a]" />
                          <p className="text-[#080c1a] font-mono text-lg mt-2 font-bold">DEMO-001</p>
                        </>
                      )}
                    </div>

                    <div className="mt-6 text-center">
                      {scanComplete ? (
                        <div className="flex items-center justify-center gap-2 text-[#4ade80]">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Objet activé avec succès !</span>
                        </div>
                      ) : (
                        <p className="text-[#a0a8b8]">Référence: DEMO-001</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!scanComplete && (
                <Button
                  onClick={handleScan}
                  disabled={isAnimating}
                  className="bg-[#10B981] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#e01e5a] transition-all transform hover:scale-105 shadow-lg shadow-[#10B981]/30 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnimating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Scan en cours...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      Simuler le scan
                    </>
                  )}
                </Button>
              )}

              {scanComplete && (
                <div className="animate-fade-in">
                  <p className="text-[#a0a8b8] mb-4">Préparation de la localisation...</p>
                  <ArrowRight className="w-6 h-6 text-[#10B981] animate-bounce mx-auto" />
                </div>
              )}
            </div>
          )}

          {/* LOCATION STEP */}
          {currentStep === 'location' && (
            <div className="text-center py-8 animate-fade-in">
              {/* Progress */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all ${
                      step === 2 ? 'bg-[#059669] w-8' : step < 2 ? 'bg-[#10B981]' : 'bg-[#1a2238]'
                    }`}
                  />
                ))}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Étape 2 : Localisez-le
              </h2>
              <p className="text-[#a0a8b8] mb-8">
                Partagez votre position pour faciliter la récupération
              </p>

              {/* Map Display */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="bg-[#0d1220] rounded-3xl p-4 border border-[#1a2238] overflow-hidden">
                    {/* Map Placeholder */}
                    <div className={`w-80 h-64 bg-[#1a2238] rounded-2xl relative overflow-hidden transition-all ${
                      locationShared ? 'border-2 border-[#1e3a2e]' : ''
                    }`}>
                      {/* Grid Pattern */}
                      <div className="absolute inset-0 opacity-30">
                        <div className="grid grid-cols-8 grid-rows-6 h-full gap-px">
                          {[...Array(48)].map((_, i) => (
                            <div key={i} className="bg-[#0d1220]" />
                          ))}
                        </div>
                      </div>

                      {/* Roads */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#0d1220]" />
                      <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-[#0d1220]" />
                      <div className="absolute top-0 bottom-0 right-1/3 w-1 bg-[#0d1220]" />

                      {/* Location Pin */}
                      {locationShared && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
                          <div className="relative">
                            <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center shadow-lg shadow-[#10B981]/50">
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#10B981]/30 rounded-full animate-ping" />
                          </div>
                        </div>
                      )}

                      {/* Center Point */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        {!locationShared && (
                          <div className="w-4 h-4 bg-[#059669] rounded-full animate-pulse" />
                        )}
                      </div>

                      {/* Location Label */}
                      {locationShared && (
                        <div className="absolute bottom-4 left-4 right-4 bg-[#0d1220]/90 rounded-lg p-3">
                          <p className="text-white text-sm font-medium">Position enregistrée</p>
                          <p className="text-[#a0a8b8] text-xs">Aéroport de Paris CDG, France</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!locationShared && (
                <Button
                  onClick={handleLocation}
                  disabled={isAnimating}
                  className="bg-[#059669] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#c04800] transition-all transform hover:scale-105 shadow-lg shadow-[#059669]/30 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnimating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Localisation...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Partager ma position
                    </>
                  )}
                </Button>
              )}

              {locationShared && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-[#4ade80] mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Position enregistrée avec succès !</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#059669] animate-bounce mx-auto" />
                </div>
              )}
            </div>
          )}

          {/* WHATSAPP STEP */}
          {currentStep === 'whatsapp' && (
            <div className="text-center py-8 animate-fade-in">
              {/* Progress */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all ${
                      step === 3 ? 'bg-[#25D366] w-8' : 'bg-[#10B981]'
                    }`}
                  />
                ))}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Étape 3 : Envoyer au propriétaire
              </h2>
              <p className="text-[#a0a8b8] mb-8">
                Recevez une notification si quelqu&apos;un trouve votre objet
              </p>

              {/* WhatsApp Card */}
              <div className="max-w-md mx-auto mb-8">
                <div className="bg-[#0d1220] rounded-3xl p-6 border border-[#1a2238]">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-left text-white">Prénom</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#080c1a] border border-[#1a2238] text-white focus:outline-none focus:border-[#25D366]"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-left text-white">WhatsApp</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#080c1a] border border-[#1a2238] text-white focus:outline-none focus:border-[#25D366]"
                        placeholder="+33 6 00 00 00 00"
                      />
                    </div>

                    {/* Message Preview */}
                    <div className="bg-[#25D366]/10 rounded-xl p-4 border border-[#25D366]/30">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0 mt-1" />
                        <div className="text-left">
                          <p className="text-white text-sm font-medium mb-1">Aperçu du message :</p>
                          <p className="text-[#a0a8b8] text-xs italic">
                            &quot;Bonjour {formData.name}, votre objet DEMO-001 a été scanné.
                            Cliquez ici pour voir sa localisation : [Lien sécurisé]&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!messageSent && (
                <Button
                  onClick={handleWhatsApp}
                  disabled={isAnimating}
                  className="bg-[#25D366] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#20bd5a] transition-all transform hover:scale-105 shadow-lg shadow-[#25D366]/30 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnimating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer la notification
                    </>
                  )}
                </Button>
              )}

              {messageSent && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-[#4ade80] mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Message envoyé !</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUCCESS STEP */}
          {currentStep === 'success' && (
            <div className="py-8 animate-fade-in">
              <div className="text-center bg-gradient-to-r from-[#10B981] to-[#059669] rounded-3xl p-12 relative overflow-hidden">
                {/* Confetti Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-white/30 rounded-full animate-confetti"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>

                {/* Success Icon */}
                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce shadow-2xl">
                  <span className="text-6xl">🎉</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Wahoo !
                </h2>

                <p className="text-white/90 max-w-lg mx-auto mb-4 text-lg">
                  Vous venez de protéger un objet en <span className="font-bold">{formatTime(elapsedTime)}</span> secondes.
                </p>

                <p className="text-white/70 max-w-lg mx-auto mb-8">
                  Sans application, sans batterie, sans GPS.
                  Juste un simple QR code.
                </p>

                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <div className="bg-white/20 rounded-xl px-6 py-3">
                    <div className="text-2xl font-bold text-white">{formatTime(elapsedTime)}</div>
                    <div className="text-white/70 text-sm">Secondes</div>
                  </div>
                  <div className="bg-white/20 rounded-xl px-6 py-3">
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-white/70 text-sm">Étapes</div>
                  </div>
                  <div className="bg-white/20 rounded-xl px-6 py-3">
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-white/70 text-sm">Sécurisé</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={resetDemo}
                    className="bg-white text-[#10B981] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Recommencer
                  </Button>
                  <Link href="/contact">
                    <Button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2">
                      <span>📦</span>
                      Commander maintenant
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Features Recap */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { icon: Smartphone, label: "Sans application", color: "#10B981" },
                  { icon: Battery, label: "Sans batterie", color: "#059669" },
                  { icon: MapPin, label: "Sans GPS", color: "#1e3a2e" },
                  { icon: Zap, label: "30 secondes", color: "#10B981" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#0d1220] rounded-xl p-4 border border-[#1a2238] text-center"
                  >
                    <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: item.color }} />
                    <span className="text-[#a0a8b8] text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(200px); }
          100% { transform: translateY(0); }
        }

        @keyframes confetti {
          0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-scan {
          animation: scan 1.5s ease-in-out infinite;
        }

        .animate-confetti {
          animation: confetti 3s linear infinite;
        }
      `}</style>
    </PublicLayout>
  );
}
