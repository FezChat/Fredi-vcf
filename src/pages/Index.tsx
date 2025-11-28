import React, { useState, useEffect } from 'react';
import { RegistrationForm } from '@/components/RegistrationForm';
import { ProgressCircle } from '@/components/ProgressCircle';
import { CountdownTimer } from '@/components/CountdownTimer';
import { VcfDashboard } from '@/components/VcfDashboard';
import { useRegistrations } from '@/hooks/useRegistrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Target, Clock, Loader2 } from 'lucide-react';

const CAMPAIGN_CONFIG = {
  name: 'Federico Vcf Tz',
  target: 500,
  channelLink: 'https://whatsapp.com/channel/0029VaihcQv84Om8LP59fO3f',
  groupLink: 'https://chat.whatsapp.com/KERPI5K0w0L9rzU00QSw40?mode=hqrt1',
  durationDays: 5
};

const Index = () => {
  const { registrations, loading, count, addRegistration } = useRegistrations();
  const [showVcfDashboard, setShowVcfDashboard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignEndDate] = useState(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + CAMPAIGN_CONFIG.durationDays);
    return endDate;
  });

  const targetReached = count >= CAMPAIGN_CONFIG.target;
  const targetLeft = Math.max(0, CAMPAIGN_CONFIG.target - count);

  useEffect(() => {
    if (targetReached) {
      setShowVcfDashboard(true);
    }
  }, [targetReached]);

  const handleTimerExpire = () => {
    setShowVcfDashboard(true);
  };

  const handleRegistration = async (data: { name: string; phone: string; email: string; profile_picture?: string }) => {
    setIsSubmitting(true);
    try {
      await addRegistration(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showVcfDashboard) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{CAMPAIGN_CONFIG.name}</h1>
            <p className="text-muted-foreground">VCF Download Dashboard</p>
          </div>
          <VcfDashboard
            registrations={registrations}
            channelLink={CAMPAIGN_CONFIG.channelLink}
            groupLink={CAMPAIGN_CONFIG.groupLink}
            campaignName={CAMPAIGN_CONFIG.name}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">{CAMPAIGN_CONFIG.name}</h1>
          <p className="text-muted-foreground">Register to get WhatsApp contacts VCF file</p>
        </div>

        {/* Quick Join Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(CAMPAIGN_CONFIG.channelLink, '_blank')}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Join Channel
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(CAMPAIGN_CONFIG.groupLink, '_blank')}
          >
            <Users className="mr-2 h-4 w-4" />
            Join Group
          </Button>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Registration Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressCircle
                current={count}
                target={CAMPAIGN_CONFIG.target}
                label="Registered"
                sublabel={`${targetLeft} left to target`}
                size={100}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-chart-2" />
                Time Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CountdownTimer
                endDate={campaignEndDate}
                onExpire={handleTimerExpire}
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-r from-primary/10 to-chart-2/10">
          <CardContent className="py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">Registered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{targetLeft}</p>
                <p className="text-xs text-muted-foreground">Target Left</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{CAMPAIGN_CONFIG.target}</p>
                <p className="text-xs text-muted-foreground">Total Target</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Indicator */}
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-muted-foreground">Live - Real-time updates</span>
        </div>

        {/* Registration Form */}
        <RegistrationForm onSubmit={handleRegistration} loading={isSubmitting} />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By registering, you agree to join our WhatsApp community for updates.
        </p>
      </div>
    </div>
  );
};

export default Index;
