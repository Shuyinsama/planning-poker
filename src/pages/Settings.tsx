import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MenuBar } from '@/components/MenuBar';
import { useSettings } from '@/contexts/SettingsContext';

export function Settings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="min-h-screen bg-background">
      <MenuBar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Voting Behavior</CardTitle>
            <CardDescription>
              Configure how voting rounds behave
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="auto-reveal" className="text-sm font-medium">
                  Auto-reveal cards when everyone has voted
                </label>
                <p className="text-sm text-muted-foreground">
                  Automatically reveal all cards once all participants have selected a card
                </p>
              </div>
              <Switch
                id="auto-reveal"
                checked={settings.autoRevealWhenAllVoted}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ autoRevealWhenAllVoted: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
