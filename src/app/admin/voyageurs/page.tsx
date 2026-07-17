'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Building,
  Users,
  QrCode,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Package
} from "lucide-react";

// Types
interface Baggage {
  id: string;
  reference: string;
  type: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
}

interface AgencyWithBaggages {
  id: string;
  name: string;
  baggages: Baggage[];
  travelerCount: number;
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending_activation: { label: 'En attente', className: 'bg-amber-100 text-amber-700 dark:bg-blue-900/30 dark:text-blue-500' },
    active: { label: 'Actif', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-blue-500' },
    scanned: { label: 'Scanné', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    lost: { label: 'Perdu', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    found: { label: 'Retrouvé', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    blocked: { label: 'Bloqué', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
  };

  const { label, className } = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// Agency Card Component
function AgencyCard({ 
  agency, 
  isExpanded, 
  onToggle 
}: { 
  agency: AgencyWithBaggages; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const activeCount = agency.baggages.filter(b => b.status === 'active' || b.status === 'scanned').length;
  const lostCount = agency.baggages.filter(b => b.status === 'lost').length;
  const pendingCount = agency.baggages.filter(b => b.status === 'pending_activation').length;

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden">
      {/* Agency Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
            <Building className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{agency.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {agency.travelerCount} voyageur{agency.travelerCount > 1 ? 's' : ''} • {agency.baggages.length} bagage{agency.baggages.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-2">
            {activeCount > 0 && (
              <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-blue-500">
                {activeCount} actif{activeCount > 1 ? 's' : ''}
              </Badge>
            )}
            {lostCount > 0 && (
              <Badge variant="outline" className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                {lostCount} perdu{lostCount > 1 ? 's' : ''}
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="outline" className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-blue-500">
                {pendingCount} en attente
              </Badge>
            )}
          </div>
          
          {/* Expand Icon */}
          <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      </button>

      {/* Expanded Content - Baggages List */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Référence</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Voyageur</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400 font-medium hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400 font-medium hidden lg:table-cell">WhatsApp</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Statut</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400 font-medium hidden xl:table-cell">Dernier scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agency.baggages.map((baggage) => (
                  <TableRow
                    key={baggage.id}
                    className={`border-slate-100 dark:border-slate-700 ${
                      baggage.status === 'lost' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-[#2563EB]" />
                        </div>
                        <span className="text-slate-800 dark:text-white font-mono font-medium text-sm">
                          {baggage.reference}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-800 dark:text-white font-medium">
                        {baggage.travelerFirstName} {baggage.travelerLastName}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-slate-600 dark:text-slate-300 text-sm">
                        {baggage.baggageType} #{baggage.baggageIndex}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-slate-600 dark:text-slate-300 text-sm">
                        {baggage.whatsappOwner || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={baggage.status} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                        {baggage.lastScanDate 
                          ? new Date(baggage.lastScanDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : 'Jamais'
                        }
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
}

// Main Page Component
export default function VoyageursAdminPage() {
  const [agencies, setAgencies] = useState<AgencyWithBaggages[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVoyageurs();
  }, []);

  const fetchVoyageurs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/voyageurs');
      const data = await response.json();
      
      // Group by agency
      const agencyMap = new Map<string, AgencyWithBaggages>();
      
      data.travelers?.forEach((traveler: {
        agencyId: string | null;
        agency: { id: string; name: string } | null;
        baggages: Baggage[];
      }) => {
        const agencyId = traveler.agencyId || 'no-agency';
        const agencyName = traveler.agency?.name || 'Sans agence';
        
        if (!agencyMap.has(agencyId)) {
          agencyMap.set(agencyId, {
            id: agencyId,
            name: agencyName,
            baggages: [],
            travelerCount: 0,
          });
        }
        
        const agency = agencyMap.get(agencyId)!;
        agency.baggages.push(...traveler.baggages);
        agency.travelerCount++;
      });
      
      // Sort agencies alphabetically, "Sans agence" at the end
      const sortedAgencies = Array.from(agencyMap.values()).sort((a, b) => {
        if (a.id === 'no-agency') return 1;
        if (b.id === 'no-agency') return -1;
        return a.name.localeCompare(b.name);
      });
      
      setAgencies(sortedAgencies);
    } catch (error) {
      console.error('Error fetching voyageurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgency = (agencyId: string) => {
    setExpandedAgencies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agencyId)) {
        newSet.delete(agencyId);
      } else {
        newSet.add(agencyId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedAgencies(new Set(agencies.map(a => a.id)));
  };

  const collapseAll = () => {
    setExpandedAgencies(new Set());
  };

  // Filter agencies
  const filteredAgencies = agencies.filter(agency => {
    if (!searchFilter) return true;
    const searchLower = searchFilter.toLowerCase();
    
    // Search in agency name
    if (agency.name.toLowerCase().includes(searchLower)) return true;
    
    // Search in baggages
    return agency.baggages.some(b => 
      b.reference.toLowerCase().includes(searchLower) ||
      `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.toLowerCase().includes(searchLower)
    );
  });

  // Calculate total stats
  const totalBaggages = agencies.reduce((sum, a) => sum + a.baggages.length, 0);
  const totalTravelers = agencies.reduce((sum, a) => sum + a.travelerCount, 0);
  const totalActive = agencies.reduce((sum, a) => sum + a.baggages.filter(b => b.status === 'active' || b.status === 'scanned').length, 0);
  const totalLost = agencies.reduce((sum, a) => sum + a.baggages.filter(b => b.status === 'lost').length, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Voyageurs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">QR codes organisés par agence</p>
        </div>
        <Button
          onClick={fetchVoyageurs}
          disabled={loading}
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total agences</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{agencies.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#2563EB]/10 dark:bg-[#2563EB]/20 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-[#2563EB]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total voyageurs</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalTravelers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Bagages actifs</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalActive}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-700 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Bagages perdus</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalLost}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher par agence, voyageur ou référence..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={expandAll}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            Tout ouvrir
          </Button>
          <Button
            onClick={collapseAll}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            Tout fermer
          </Button>
        </div>
      </div>

      {/* Agencies List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : filteredAgencies.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucun voyageur trouvé</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              {searchFilter ? 'Modifiez vos critères de recherche' : 'Les voyageurs apparaîtront ici une fois les QR codes générés'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAgencies.map((agency) => (
            <AgencyCard
              key={agency.id}
              agency={agency}
              isExpanded={expandedAgencies.has(agency.id)}
              onToggle={() => toggleAgency(agency.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
