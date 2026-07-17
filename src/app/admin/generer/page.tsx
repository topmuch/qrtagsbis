'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  RefreshCw,
  CheckCircle,
  Building2,
  Loader2,
  Download,
  Package,
  User,
  Tag,
} from "lucide-react";
import { AGENCY_TYPES, AGENCY_TYPE_LIST, type AgencyType as AgencyTypeEnum } from '@/lib/agency-types';

// Types
interface Agency {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  agencyTypeId?: string;
  agencyType?: { name: string; label: string } | null;
}

type GenerationMode = 'individual' | 'batch';

export default function GenererTagsPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastGeneratedRefs, setLastGeneratedRefs] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Mode
  const [mode, setMode] = useState<GenerationMode>('individual');

  // Individual form
  const [individualForm, setIndividualForm] = useState({
    agencyType: 'hotel' as AgencyTypeEnum,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    itemName: '',
    itemDescription: '',
    itemCategory: 'autres',
    customData: {} as Record<string, string>,
  });

  // Batch form
  const [batchForm, setBatchForm] = useState({
    agencyId: '',
    agencyType: 'hotel' as AgencyTypeEnum,
    count: 10,
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agencies');
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualGenerate = async () => {
    setQrGenerating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const agencyType = AGENCY_TYPES[individualForm.agencyType];
      const customDataObj: Record<string, string> = {};
      agencyType.fields.forEach(field => {
        const val = individualForm.customData[field.name];
        if (val) customDataObj[field.name] = val;
      });

      const response = await fetch('/api/admin/tags/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'individual',
          agencyType: individualForm.agencyType,
          ownerName: individualForm.ownerName,
          ownerPhone: individualForm.ownerPhone,
          ownerEmail: individualForm.ownerEmail,
          itemName: individualForm.itemName,
          itemDescription: individualForm.itemDescription,
          itemCategory: individualForm.itemCategory,
          customData: customDataObj,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`${data.generated} tag(s) généré(s) avec succès !`);
        setLastGeneratedRefs(data.references || []);
        // Reset form
        setIndividualForm(prev => ({
          ...prev,
          ownerName: '',
          ownerPhone: '',
          ownerEmail: '',
          itemName: '',
          itemDescription: '',
          customData: {},
        }));
      } else {
        setErrorMessage(data.error || 'Erreur lors de la génération');
      }
    } catch {
      setErrorMessage('Erreur de connexion au serveur');
    } finally {
      setQrGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!batchForm.agencyId) {
      setErrorMessage('Veuillez sélectionner une agence');
      return;
    }

    setQrGenerating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/tags/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'batch',
          agencyId: batchForm.agencyId,
          agencyType: batchForm.agencyType,
          count: batchForm.count,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`${data.generated} tag(s) généré(s) avec succès !`);
        setLastGeneratedRefs(data.references || []);
      } else {
        setErrorMessage(data.error || 'Erreur lors de la génération');
      }
    } catch {
      setErrorMessage('Erreur de connexion au serveur');
    } finally {
      setQrGenerating(false);
    }
  };

  const handleExportZip = async () => {
    if (lastGeneratedRefs.length === 0) return;
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/tags/export-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ references: lastGeneratedRefs }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QRTags-export-${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Erreur lors de l'export");
      }
    } catch {
      setErrorMessage("Erreur lors de l'export ZIP");
    } finally {
      setIsExporting(false);
    }
  };

  const currentAgencyType = AGENCY_TYPES[individualForm.agencyType];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Générer des Tags QR</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Créez des tags QR codes individuellement ou en lot</p>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-300">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <span className="text-red-700 dark:text-red-300">{errorMessage}</span>
        </div>
      )}

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as GenerationMode)} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <TabsTrigger value="individual" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-600">
            <User className="w-4 h-4 mr-2" />
            Individuel
          </TabsTrigger>
          <TabsTrigger value="batch" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-600">
            <Package className="w-4 h-4 mr-2" />
            Lot
          </TabsTrigger>
        </TabsList>

        {/* Individual Mode */}
        <TabsContent value="individual">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white">Générer un tag individuel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agency Type Selection */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Type d&apos;agence</Label>
                <Select
                  value={individualForm.agencyType}
                  onValueChange={(v) => setIndividualForm({ ...individualForm, agencyType: v as AgencyTypeEnum, customData: {} })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {AGENCY_TYPE_LIST.map((type) => (
                      <SelectItem key={type} value={type}>
                        {AGENCY_TYPES[type].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic fields based on agency type */}
              {currentAgencyType && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Champs spécifiques — {currentAgencyType.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentAgencyType.fields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <Label className="text-slate-700 dark:text-slate-300 text-sm">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          type={field.type === 'textarea' ? 'text' : field.type}
                          value={individualForm.customData[field.name] || ''}
                          onChange={(e) => setIndividualForm({
                            ...individualForm,
                            customData: { ...individualForm.customData, [field.name]: e.target.value }
                          })}
                          placeholder={field.label}
                          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common owner fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Nom du propriétaire</Label>
                  <Input
                    value={individualForm.ownerName}
                    onChange={(e) => setIndividualForm({ ...individualForm, ownerName: e.target.value })}
                    placeholder="Jean Dupont"
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Téléphone</Label>
                  <Input
                    type="tel"
                    value={individualForm.ownerPhone}
                    onChange={(e) => setIndividualForm({ ...individualForm, ownerPhone: e.target.value })}
                    placeholder="+221 77 123 4567"
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Item fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Nom de l&apos;objet</Label>
                  <Input
                    value={individualForm.itemName}
                    onChange={(e) => setIndividualForm({ ...individualForm, itemName: e.target.value })}
                    placeholder="Valise noire, Sac à dos..."
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Catégorie</Label>
                  <Select
                    value={individualForm.itemCategory}
                    onValueChange={(v) => setIndividualForm({ ...individualForm, itemCategory: v })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="bagage">Bagage</SelectItem>
                      <SelectItem value="electronique">Électronique</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="vetements">Vêtements</SelectItem>
                      <SelectItem value="cles">Clés</SelectItem>
                      <SelectItem value="autres">Autres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleIndividualGenerate}
                disabled={qrGenerating}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12"
              >
                {qrGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération en cours...</>
                ) : (
                  <><QrCode className="w-4 h-4 mr-2" /> Générer 1 tag</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Mode */}
        <TabsContent value="batch">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white">Générer des tags en lot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Agence</Label>
                  <Select
                    value={batchForm.agencyId}
                    onValueChange={(v) => {
                      const agency = agencies.find(a => a.id === v);
                      setBatchForm({
                        ...batchForm,
                        agencyId: v,
                        agencyType: (agency?.agencyType?.name as AgencyTypeEnum) || 'hotel',
                      });
                    }}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                      <SelectValue placeholder="Sélectionner une agence" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Type d&apos;agence</Label>
                  <Select
                    value={batchForm.agencyType}
                    onValueChange={(v) => setBatchForm({ ...batchForm, agencyType: v as AgencyTypeEnum })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {AGENCY_TYPE_LIST.map((type) => (
                        <SelectItem key={type} value={type}>
                          {AGENCY_TYPES[type].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Nombre de tags à générer</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={batchForm.count}
                  onChange={(e) => setBatchForm({ ...batchForm, count: parseInt(e.target.value) || 1 })}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <p className="text-xs text-slate-400">Maximum 1000 tags par lot</p>
              </div>

              <Button
                onClick={handleBatchGenerate}
                disabled={qrGenerating || !batchForm.agencyId}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12"
              >
                {qrGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération en cours...</>
                ) : (
                  <><Package className="w-4 h-4 mr-2" /> Générer {batchForm.count} tag(s)</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Tags Preview */}
      {lastGeneratedRefs.length > 0 && (
        <Card className="mt-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-800 dark:text-white">
                Tags générés ({lastGeneratedRefs.length})
              </CardTitle>
              <Button
                onClick={handleExportZip}
                disabled={isExporting}
                variant="outline"
                className="border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl"
              >
                {isExporting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Export...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Exporter ZIP</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {lastGeneratedRefs.map((ref, i) => (
                <Badge key={i} variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs">
                  {ref}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
