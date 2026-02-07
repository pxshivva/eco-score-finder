import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState, useEffect } from 'react';
import { getLoginUrl } from '@/const';

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    enablePriceDropNotifications: true,
    enableNewAlternativeNotifications: true,
    priceDropThreshold: 10,
    minEcoScore: 50,
  });
  const [isSaving, setIsSaving] = useState(false);

  const preferencesQuery = trpc.preferences.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updatePreferencesMutation = trpc.preferences.update.useMutation({
    onSuccess: () => {
      preferencesQuery.refetch();
      setIsSaving(false);
      alert('Preferences updated successfully!');
    },
    onError: () => {
      setIsSaving(false);
      alert('Failed to update preferences');
    },
  });

  useEffect(() => {
    if (preferencesQuery.data) {
      setFormData({
        enablePriceDropNotifications: preferencesQuery.data.enablePriceDropNotifications ?? true,
        enableNewAlternativeNotifications: preferencesQuery.data.enableNewAlternativeNotifications ?? true,
        priceDropThreshold: parseFloat(preferencesQuery.data.priceDropThreshold?.toString() || '10'),
        minEcoScore: preferencesQuery.data.minEcoScore ?? 50,
      });
    }
  }, [preferencesQuery.data]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex flex-col items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <SettingsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to manage your preferences.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    updatePreferencesMutation.mutate({
      enablePriceDropNotifications: formData.enablePriceDropNotifications,
      enableNewAlternativeNotifications: formData.enableNewAlternativeNotifications,
      priceDropThreshold: formData.priceDropThreshold,
      minEcoScore: formData.minEcoScore,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Profile Section */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Name
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Notification Preferences
          </h2>
          <div className="space-y-6">
            {/* Price Drop Notifications */}
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="enablePriceDropNotifications"
                name="enablePriceDropNotifications"
                checked={formData.enablePriceDropNotifications}
                onChange={handleInputChange}
                className="w-5 h-5 mt-1 rounded border-gray-300 text-green-600 focus:ring-0"
              />
              <div className="flex-1">
                <label
                  htmlFor="enablePriceDropNotifications"
                  className="block text-sm font-semibold text-gray-900 mb-1 cursor-pointer"
                >
                  Price Drop Notifications
                </label>
                <p className="text-sm text-gray-600">
                  Get notified when sustainable alternatives drop to competitive price points
                </p>
              </div>
            </div>

            {/* Price Drop Threshold */}
            {formData.enablePriceDropNotifications && (
              <div className="ml-9">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Price Drop Threshold (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    name="priceDropThreshold"
                    min="5"
                    max="50"
                    step="5"
                    value={formData.priceDropThreshold}
                    onChange={handleInputChange}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-0"
                  />
                  <span className="text-sm text-gray-600">
                    Notify me when prices drop by {formData.priceDropThreshold}% or more
                  </span>
                </div>
              </div>
            )}

            {/* New Alternative Notifications */}
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="enableNewAlternativeNotifications"
                name="enableNewAlternativeNotifications"
                checked={formData.enableNewAlternativeNotifications}
                onChange={handleInputChange}
                className="w-5 h-5 mt-1 rounded border-gray-300 text-green-600 focus:ring-0"
              />
              <div className="flex-1">
                <label
                  htmlFor="enableNewAlternativeNotifications"
                  className="block text-sm font-semibold text-gray-900 mb-1 cursor-pointer"
                >
                  New Eco-Friendly Alternatives
                </label>
                <p className="text-sm text-gray-600">
                  Get notified when new sustainable products matching your preferences become available
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Eco-Score Preferences */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Eco-Score Preferences
          </h2>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Minimum Eco-Score
            </label>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="range"
                name="minEcoScore"
                min="0"
                max="100"
                step="10"
                value={formData.minEcoScore}
                onChange={handleInputChange}
                className="flex-1"
              />
              <span className="text-lg font-bold text-gray-900 w-12">
                {formData.minEcoScore}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Only show products with an eco-score of {formData.minEcoScore} or higher in recommendations
            </p>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation('/dashboard')}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
