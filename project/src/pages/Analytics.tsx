import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Leaf, Package, PieChart, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchAggregatedFertilizerStock } from '../lib/fertilizerStock';
import { Crop, FertilizerStock, Dealer } from '../types/database';

export function Analytics() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fertilizers, setFertilizers] = useState<FertilizerStock[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [cropsRes, dealersRes, aggregatedFertilizers] = await Promise.all([
        supabase.from('crops').select('*'),
        supabase.from('dealers').select('*'),
        fetchAggregatedFertilizerStock(),
      ]);

      if (cropsRes.data) setCrops(cropsRes.data);
      setFertilizers(aggregatedFertilizers);
      if (dealersRes.data) setDealers(dealersRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAcreage = crops.reduce((sum, crop) => sum + crop.acreage, 0);
  const totalFertilizer = fertilizers.reduce((sum, f) => sum + f.quantity_available, 0);

  const cropChartData = crops.map(crop => ({
    name: crop.crop_name,
    acreage: crop.acreage,
    percentage: totalAcreage > 0 ? ((crop.acreage / totalAcreage) * 100).toFixed(1) : 0,
  }));

  const fertilizerChartData = fertilizers.map(f => ({
    name: f.fertilizer_type,
    quantity: f.quantity_available,
  }));

  const maxCropAcreage = Math.max(...crops.map(c => c.acreage), 1);
  const maxFertilizerQty = Math.max(...fertilizers.map(f => f.quantity_available), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Agricultural data insights and statistics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Crop Area</p>
              <p className="text-2xl font-bold text-gray-900">{totalAcreage.toLocaleString()}</p>
              <p className="text-xs text-gray-500">acres</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fertilizer Stock</p>
              <p className="text-2xl font-bold text-gray-900">{totalFertilizer.toLocaleString()}</p>
              <p className="text-xs text-gray-500">kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Dealers</p>
              <p className="text-2xl font-bold text-gray-900">{dealers.length}</p>
              <p className="text-xs text-gray-500">registered</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Crop Types</p>
              <p className="text-2xl font-bold text-gray-900">{crops.length}</p>
              <p className="text-xs text-gray-500">varieties</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Crop Distribution</h2>
          </div>
          <div className="space-y-4">
            {cropChartData.map((crop) => (
              <div key={crop.name} className="group">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{crop.name}</span>
                  <span className="text-sm text-gray-500">{crop.acreage.toLocaleString()} acres ({crop.percentage}%)</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 group-hover:from-emerald-600 group-hover:to-emerald-500"
                    style={{ width: `${(crop.acreage / maxCropAcreage) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fertilizer Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Fertilizer Stock</h2>
          </div>
          <div className="space-y-4">
            {fertilizerChartData.map((fertilizer) => (
              <div key={fertilizer.name} className="group">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{fertilizer.name}</span>
                  <span className="text-sm text-gray-500">{fertilizer.quantity.toLocaleString()} kg</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500 group-hover:from-amber-600 group-hover:to-amber-500"
                    style={{ width: `${(fertilizer.quantity / maxFertilizerQty) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dealer Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Dealer Locations</h2>
        </div>
        {dealers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {dealers.map((dealer) => (
              <div key={dealer.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="font-medium text-gray-900 text-sm truncate">{dealer.dealer_name}</p>
                <p className="text-xs text-gray-500 truncate">{dealer.location}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No dealers registered</p>
          </div>
        )}
      </div>
    </div>
  );
}
