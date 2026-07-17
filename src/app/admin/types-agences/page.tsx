'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Hotel,
  Bus,
  GraduationCap,
  Stethoscope,
  Car,
  Luggage,
  Building2,
  PartyPopper,
  Edit,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Layers,
} from "lucide-react";
import { AGENCY_TYPES, AGENCY_TYPE_LIST, type AgencyType as AgencyTypeEnum, type AgencyFieldDef } from '@/lib/agency-types';

// Icon map for dynamic rendering
const iconMap: Record<string, React.ReactNode> = {
  Hotel: <Hotel className="w-8 h-8" />,
  Bus: <Bus className="w-8 h-8" />,
  GraduationCap: <GraduationCap className="w-8 h-8" />,
  Stethoscope: <Stethoscope className="w-8 h-8" />,
  Car: <Car className="w-8 h-8" />,
  Luggage: <Luggage className="w-8 h-8" />,
  Building2: <Building2 className="w-8 h-8" />,
  PartyPopper: <PartyPopper className="w-8 h-8" />,
};

interface AgencyTypeData {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  customFields: string; // JSON
  isActive: boolean;
  _count?: { agencies: number };
}

export default function TypesAgencesPage() {
  const [types, setTypes] = useState<AgencyTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editType, setEditType] = useState<AgencyTypeData | null>(null);
  const [editFields, setEditFields] = useState<AgencyFieldDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agency-types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data.types || []);
      }
    } catch (error) {
      console.error('Error fetching agency types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: AgencyTypeData) => {
    setEditType(type);
    try {
      const fields = type.customFields ? JSON.parse(type.customFields) : AGENCY_TYPES[type.name as AgencyTypeEnum]?.fields || [];
      setEditFields(fields);
    } catch {
      setEditFields(AGENCY_TYPES[type.name as AgencyTypeEnum]?.fields || []);
    }
    setEditDialogOpen(true);
  };

  const handleSaveFields = async () => {
    if (!editType) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/agency-types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editType.id,
          customFields: JSON.stringify(editFields),
        }),
      });
      if (res.ok) {
        setSuccessMessage('Champs mis à jour avec succès');
        setEditDialogOpen(false);
        fetchTypes();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving fields:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type: AgencyTypeData) => {
    try {
      const res = await fetch('/api/admin/agency-types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: type.id, isActive: !type.isActive }),
      });
      if (res.ok) {
        fetchTypes();
      }
    } catch (error) {
      console.error('Error toggling type:', error);
    }
  };

  const addField = () => {
    setEditFields([...editFields, { name: '', label: '', type: 'text', required: false }]);
  };

  const removeField = (index: number) => {
    setEditFields(editFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof AgencyFieldDef, value: string | boolean) => {
    const updated = [...editFields];
    updated[index] = { ...updated[index], [key]: value };
    setEditFields(updated);
  };

  // Merge static definitions with DB data
  const displayTypes = AGENCY_TYPE_LIST.map(typeKey => {
    const dbType = types.find(t => t.name === typeKey);
    const staticDef = AGENCY_TYPES[typeKey];
    return {
      key: typeKey,
      name: staticDef.name,
      icon: staticDef.icon,
      color: staticDef.color,
      fields: staticDef.fields,
      isActive: dbType?.isActive ?? true,
      agencyCount: dbType?._count?.agencies ?? 0,
      dbId: dbType?.id,
    };
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Types d&apos;Agences</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les 8 métiers supportés par QRTags</p>
        </div>
        <Button
          onClick={fetchTypes}
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300">
          {successMessage}
        </div>
      )}

      {/* Type Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded-2xl p-6 h-48 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayTypes.map((type) => (
            <Card
              key={type.key}
              className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-lg transition-all duration-300 ${!type.isActive ? 'opacity-50' : ''}`}
              style={{ borderTop: `3px solid ${type.color}` }}
            >
              <CardContent className="p-6">
                {/* Icon & Name */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${type.color}15`, color: type.color }}
                  >
                    {iconMap[type.icon] || <Layers className="w-8 h-8" />}
                  </div>
                  <Badge
                    className={type.isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }
                  >
                    {type.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{type.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {type.fields.length} champ{type.fields.length > 1 ? 's' : ''} personnalisé{type.fields.length > 1 ? 's' : ''}
                </p>

                {/* Agency count */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                    <Building2 className="w-4 h-4" />
                    {type.agencyCount} agence{type.agencyCount > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {type.dbId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(types.find(t => t.id === type.dbId)!)}
                      className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  )}
                  {type.dbId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(types.find(t => t.id === type.dbId)!)}
                      className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl"
                    >
                      {type.isActive ? <ToggleRight className="w-4 h-4 mr-1" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
                      {type.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Fields Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">
              Modifier les champs — {editType?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {editFields.map((field, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Nom du champ</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(index, 'name', e.target.value)}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, 'label', e.target.value)}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Type</Label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, 'type', e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm"
                    >
                      <option value="text">Texte</option>
                      <option value="tel">Téléphone</option>
                      <option value="email">Email</option>
                      <option value="date">Date</option>
                      <option value="time">Heure</option>
                      <option value="textarea">Zone de texte</option>
                    </select>
                  </div>
                  <div className="space-y-1 flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, 'required', e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Requis</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => removeField(index)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addField}
              className="w-full border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 rounded-xl"
            >
              + Ajouter un champ
            </Button>
            <Button
              onClick={handleSaveFields}
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
