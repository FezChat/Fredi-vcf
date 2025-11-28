import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Smartphone, CheckCircle, MessageCircle, Users } from 'lucide-react';
import { Registration } from '@/types/registration';

interface VcfDashboardProps {
  registrations: Registration[];
  channelLink: string;
  groupLink: string;
  campaignName: string;
}

export const VcfDashboard: React.FC<VcfDashboardProps> = ({
  registrations,
  channelLink,
  groupLink,
  campaignName
}) => {
  const generateVcf = () => {
    let vcfContent = '';
    
    registrations.forEach((reg) => {
      vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${reg.name}
TEL;TYPE=CELL:${reg.phone}
EMAIL:${reg.email}
END:VCARD
`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaignName.replace(/\s+/g, '_')}_contacts.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const instructions = [
    { step: 1, title: 'Download VCF File', description: 'Click the download button below to get your contacts file' },
    { step: 2, title: 'Open Downloads', description: 'Go to your phone\'s Downloads folder or Files app' },
    { step: 3, title: 'Tap on VCF File', description: 'Find and tap on the downloaded .vcf file' },
    { step: 4, title: 'Import Contacts', description: 'Select "Import" or "Add to Contacts" when prompted' },
    { step: 5, title: 'Join WhatsApp Groups', description: 'Click the buttons below to join our channel and group' }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">🎉 Target Reached!</CardTitle>
          <CardDescription>
            {registrations.length} contacts are ready for download
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateVcf} className="w-full" size="lg">
            <Download className="mr-2 h-5 w-5" />
            Download VCF File ({registrations.length} contacts)
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(channelLink, '_blank')}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Join Channel
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(groupLink, '_blank')}
            >
              <Users className="mr-2 h-4 w-4" />
              Join Group
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            How to Import VCF File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instructions.map((instruction) => (
              <div key={instruction.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {instruction.step}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{instruction.title}</h4>
                  <p className="text-sm text-muted-foreground">{instruction.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Make sure you have enough storage space on your device</p>
          <p>• Allow your phone to access the downloaded file</p>
          <p>• Choose "Phone" or "SIM" as the save location</p>
          <p>• Wait for all contacts to import before closing</p>
        </CardContent>
      </Card>
    </div>
  );
};
