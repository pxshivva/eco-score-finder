import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Loader2, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ProductContributionDialogProps {
  barcode?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function ProductContributionDialog({
  barcode: initialBarcode,
  onSuccess,
  trigger,
}: ProductContributionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [userComment, setUserComment] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [barcodeValid, setBarcodeValid] = useState<boolean | null>(null);

  const submitMutation = trpc.contribution.submit.useMutation();

  const handleBarcodeChange = (value: string) => {
    setBarcode(value);
    if (value.length > 0) {
      const cleanBarcode = value.replace(/\D/g, '');
      const isValid = [8, 12, 13, 14].includes(cleanBarcode.length);
      setBarcodeValid(isValid);
    } else {
      setBarcodeValid(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode || !productName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!barcodeValid) {
      toast.error('Please enter a valid barcode');
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        barcode,
        productName,
        brand: brand || undefined,
        category: category || undefined,
        ingredients: ingredients || undefined,
        userEmail: userEmail || undefined,
        userComment: userComment || undefined,
      });

      if (result.success) {
        toast.success(result.message);
        if (result.offUrl) {
          toast.success(
            <div className="flex flex-col gap-2">
              <p>{result.message}</p>
              <a
                href={result.offUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View on Open Food Facts →
              </a>
            </div>
          );
        }
        // Reset form
        setBarcode(initialBarcode || '');
        setProductName('');
        setBrand('');
        setCategory('');
        setIngredients('');
        setUserComment('');
        setUserEmail('');
        setBarcodeValid(null);
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.message || 'Failed to submit contribution');
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
      toast.error('An error occurred while submitting your contribution');
    }
  };

  const handleOpenManualContribution = () => {
    if (!barcode) {
      toast.error('Please enter a barcode first');
      return;
    }

    const cleanBarcode = barcode.replace(/\D/g, '');
    const url = `https://world.openfoodfacts.org/cgi/product.pl?action=process&type=add&code=${cleanBarcode}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Contribute Product Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contribute Product Data</DialogTitle>
          <DialogDescription>
            Help improve Open Food Facts by contributing missing product information. Your data will be reviewed and added to the database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barcode Field */}
          <div className="space-y-2">
            <Label htmlFor="barcode">
              Barcode <span className="text-red-500">*</span>
            </Label>
            <Input
              id="barcode"
              type="text"
              placeholder="Enter product barcode (EAN-13, UPC, etc.)"
              value={barcode}
              onChange={(e) => handleBarcodeChange(e.target.value)}
              disabled={submitMutation.isPending}
            />
            {barcodeValid !== null && (
              <div className={`flex items-center gap-2 text-sm ${barcodeValid ? 'text-green-600' : 'text-red-600'}`}>
                {barcodeValid ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Valid barcode format</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Invalid barcode format</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Product Name Field */}
          <div className="space-y-2">
            <Label htmlFor="productName">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="productName"
              type="text"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={submitMutation.isPending}
            />
          </div>

          {/* Brand Field */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              type="text"
              placeholder="Enter brand name"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              disabled={submitMutation.isPending}
            />
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              type="text"
              placeholder="e.g., Beverages, Snacks, Dairy"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitMutation.isPending}
            />
          </div>

          {/* Ingredients Field */}
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients</Label>
            <Textarea
              id="ingredients"
              placeholder="List ingredients separated by commas"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              disabled={submitMutation.isPending}
              rows={3}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="userEmail">Email (optional)</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="your@email.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              disabled={submitMutation.isPending}
            />
          </div>

          {/* Comment Field */}
          <div className="space-y-2">
            <Label htmlFor="userComment">Additional Comments</Label>
            <Textarea
              id="userComment"
              placeholder="Any additional information about this product"
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              disabled={submitMutation.isPending}
              rows={2}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Tips for better contributions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Include all ingredients from the product label</li>
              <li>Use the exact product name from the packaging</li>
              <li>Double-check the barcode before submitting</li>
              <li>Your contribution helps thousands of users make better choices</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={submitMutation.isPending || !barcodeValid || !productName}
              className="flex-1"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Contribution'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenManualContribution}
              disabled={!barcode || !barcodeValid}
              title="Open Open Food Facts website to contribute manually"
            >
              Manual Entry
            </Button>
          </div>

          {/* Error Message */}
          {submitMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <p className="font-semibold">Error</p>
              <p>{submitMutation.error?.message || 'Failed to submit contribution'}</p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
