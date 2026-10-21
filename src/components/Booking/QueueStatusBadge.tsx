import React from 'react';
import { Users, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { InspectionSlot } from '../../types/marketplace';

interface QueueStatusBadgeProps {
  slot: InspectionSlot;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const QueueStatusBadge: React.FC<QueueStatusBadgeProps> = ({
  slot,
  size = 'md',
  showDetails = false,
}) => {
  const isFull = slot.bookedCount >= slot.capacityLimit;
  const remaining = Math.max(0, slot.capacityLimit - slot.bookedCount);

  if (isFull) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[11px]'
            : size === 'lg'
            ? 'px-3.5 py-1.5 text-sm'
            : 'px-2.5 py-1 text-xs'
        } bg-[#F0544F]/10 text-[#F0544F] border border-[#F0544F]/30 animate-pulse-subtle`}
        title="Agent window at max capacity (5 tenants max to protect your time)"
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#F0544F]" />
        <span>Agent Slot Full (5/5)</span>
        {slot.waitlistCount > 0 && (
          <span className="bg-[#F0544F] text-white px-1.5 py-0.2 rounded-full text-[10px] ml-0.5">
            {slot.waitlistCount} queued
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all ${
        size === 'sm'
          ? 'px-2 py-0.5 text-[11px]'
          : size === 'lg'
          ? 'px-3.5 py-1.5 text-sm'
          : 'px-2.5 py-1 text-xs'
      } bg-white/90 backdrop-blur-md text-[#000004] border border-[#E5E7EB] shadow-xs`}
    >
      <Users className="w-3.5 h-3.5 text-[#342A21]" />
      <span className="font-semibold text-[#000004]">
        {slot.bookedCount}/5 booked
      </span>
      {remaining <= 2 ? (
        <span className="text-[#F0544F] font-bold text-[10px] ml-0.5">
          ({remaining} left!)
        </span>
      ) : (
        <span className="text-[#70798C] text-[11px]">
          ({remaining} available)
        </span>
      )}
    </div>
  );
};
