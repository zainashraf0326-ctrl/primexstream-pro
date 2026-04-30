'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp, User } from 'lucide-react';

interface ReferralNode {
  id: string;
  name: string;
  email: string;
  rewardAmount: number;
  children?: ReferralNode[];
}

interface ReferralTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  referrals: any[];
  userStats: any;
}

export function ReferralTreeModal({ isOpen, onClose, referrals, userStats }: ReferralTreeModalProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Build tree structure - level 1 are direct referrals, level 2 are their referrals
  const buildTree = () => {
    const referralMap = new Map();
    referrals.forEach(ref => {
      referralMap.set(ref.id, { ...ref, children: [] });
    });

    // Try to find parent-child relationships if stored in DB
    // For now, return first level only (direct referrals)
    return referrals.map(ref => ({
      ...ref,
      children: referrals.filter(child => child.referrerId === ref.id) || []
    }));
  };

  const tree = buildTree();

  const ReferralNode = ({ node, level = 0 }: { node: any; level?: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isLevel2 = level >= 1;

    return (
      <div key={node.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div className={`p-3 rounded-lg border mb-2 flex items-center gap-3 transition-all ${
          level === 0 
            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' 
            : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
        }`}>
          <User className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-slate-900 dark:text-white">
              {node.referredName || 'User'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {node.referredEmail || 'No email'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              +₹{node.rewardAmount}
            </span>
            {hasChildren && !isLevel2 && (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-white/50 dark:hover:bg-slate-800 rounded"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Show children only if level 0 and expanded, or if level 1 (2-step limit) */}
        {hasChildren && (level < 1) && isExpanded && (
          <div>
            {node.children.map((child: any) => (
              <ReferralNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto glass glass-light dark:glass">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Your Referral Network
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Total Referrals: {userStats.total} • Click to expand and see their referrals
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {tree.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">
                No referrals yet. Share your code to get started!
              </p>
            </div>
          ) : (
            tree.map(referral => (
              <ReferralNode key={referral.id} node={referral} level={0} />
            ))
          )}
        </div>

        <div className="sticky bottom-0 p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex gap-2">
          <Button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
