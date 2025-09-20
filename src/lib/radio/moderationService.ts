/**
 * Moderation service for radio system
 * Handles content filtering, automated moderation, and safety controls
 */

import { prisma } from '@/lib/prisma';
import { radioService } from './radioService';
import { playlistManager } from './playlistManager';

export interface ModerationRule {
  id: string;
  type: 'genre' | 'artist' | 'track' | 'content' | 'explicit' | 'copyright';
  action: 'block' | 'flag' | 'limit' | 'allow' | 'review';
  criteria: string;
  description: string;
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentFilter {
  id: string;
  type: 'explicit_lyrics' | 'inappropriate_content' | 'copyright_issue' | 'quality_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: 'block' | 'flag' | 'review' | 'allow';
  enabled: boolean;
}

export interface ModerationAction {
  id: string;
  type: 'block' | 'flag' | 'review' | 'allow';
  targetType: 'track' | 'artist' | 'playlist' | 'user';
  targetId: string;
  reason: string;
  moderatorId?: string;
  automated: boolean;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'track' | 'artist' | 'playlist' | 'user';
  targetId: string;
  targetName: string;
  reason: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export class ModerationService {
  private static instance: ModerationService;
  private rules: ModerationRule[] = [];
  private filters: ContentFilter[] = [];
  private actions: ModerationAction[] = [];
  private reports: SafetyReport[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultFilters();
  }

  static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  /**
   * Initialize default moderation rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'rule_1',
        type: 'explicit',
        action: 'flag',
        criteria: 'explicit_lyrics',
        description: 'Flag tracks with explicit lyrics',
        enabled: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rule_2',
        type: 'content',
        action: 'block',
        criteria: 'inappropriate_content',
        description: 'Block inappropriate content',
        enabled: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rule_3',
        type: 'copyright',
        action: 'review',
        criteria: 'copyright_issue',
        description: 'Review potential copyright issues',
        enabled: true,
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Initialize default content filters
   */
  private initializeDefaultFilters(): void {
    this.filters = [
      {
        id: 'filter_1',
        type: 'explicit_lyrics',
        severity: 'medium',
        description: 'Filter explicit lyrics',
        action: 'flag',
        enabled: true,
      },
      {
        id: 'filter_2',
        type: 'inappropriate_content',
        severity: 'high',
        description: 'Filter inappropriate content',
        action: 'block',
        enabled: true,
      },
      {
        id: 'filter_3',
        type: 'copyright_issue',
        severity: 'critical',
        description: 'Filter copyright issues',
        action: 'review',
        enabled: true,
      },
      {
        id: 'filter_4',
        type: 'quality_issue',
        severity: 'low',
        description: 'Filter low quality content',
        action: 'flag',
        enabled: true,
      },
    ];
  }

  /**
   * Check if content is safe for radio
   */
  async checkContentSafety(content: {
    type: 'track' | 'artist' | 'playlist';
    id: string;
    name: string;
    description?: string;
    genre?: string;
    tags?: string[];
  }): Promise<{
    isSafe: boolean;
    issues: string[];
    action: 'allow' | 'flag' | 'block' | 'review' | 'limit';
    confidence: number;
  }> {
    const issues: string[] = [];
    let action: string = 'allow';
    let confidence = 1.0;

    // Check against moderation rules
    for (const rule of this.rules.filter(r => r.enabled)) {
      const ruleResult = await this.checkRule(rule, content);
      if (ruleResult.matches) {
        issues.push(ruleResult.reason);
        confidence *= 0.8; // Reduce confidence for each issue

        // Determine action based on rule priority and type
        if (rule.action === 'block') {
          action = 'block';
          break; // Block immediately
        } else if (rule.action === 'flag' && action !== 'block') {
          action = 'flag';
        } else if (rule.action === 'review' && action !== 'block' && action !== 'flag') {
          action = 'review';
        }
      }
    }

    // Check against content filters
    for (const filter of this.filters.filter(f => f.enabled)) {
      const filterResult = await this.checkFilter(filter, content);
      if (filterResult.matches) {
        issues.push(filterResult.reason);
        confidence *= 0.9;

        if (filter.action === 'block') {
          action = 'block';
          break;
        } else if (filter.action === 'flag' && (action as string) !== 'block') {
          action = 'flag';
        } else if (filter.action === 'review' && (action as string) !== 'block' && (action as string) !== 'flag') {
          action = 'review';
        }
      }
    }

    // Check for existing moderation actions
    const existingAction = this.actions.find(
      a => a.targetId === content.id && a.status === 'approved'
    );
    if (existingAction) {
      if (existingAction.type === 'block') {
        action = 'block';
        issues.push('Content previously blocked');
      } else if (existingAction.type === 'flag') {
        action = 'flag';
        issues.push('Content previously flagged');
      }
    }

    return {
      isSafe: action === 'allow',
      issues,
      action: action as 'allow' | 'flag' | 'block' | 'review' | 'limit',
      confidence: Math.max(0.1, confidence), // Minimum confidence of 0.1
    };
  }

  /**
   * Check if content matches a specific rule
   */
  private async checkRule(rule: ModerationRule, content: any): Promise<{
    matches: boolean;
    reason: string;
  }> {
    switch (rule.type) {
      case 'explicit':
        if (rule.criteria === 'explicit_lyrics') {
          // Check for explicit content indicators
          const explicitIndicators = ['explicit', 'explicit lyrics', 'parental advisory'];
          const hasExplicit = explicitIndicators.some(indicator =>
            content.name?.toLowerCase().includes(indicator) ||
            content.description?.toLowerCase().includes(indicator) ||
            content.tags?.some((tag: string) => tag.toLowerCase().includes(indicator))
          );
          
          if (hasExplicit) {
            return {
              matches: true,
              reason: 'Contains explicit content indicators',
            };
          }
        }
        break;

      case 'content':
        if (rule.criteria === 'inappropriate_content') {
          // Check for inappropriate content
          const inappropriateTerms = ['inappropriate', 'offensive', 'hate speech'];
          const hasInappropriate = inappropriateTerms.some(term =>
            content.name?.toLowerCase().includes(term) ||
            content.description?.toLowerCase().includes(term)
          );
          
          if (hasInappropriate) {
            return {
              matches: true,
              reason: 'Contains potentially inappropriate content',
            };
          }
        }
        break;

      case 'copyright':
        if (rule.criteria === 'copyright_issue') {
          // Check for potential copyright issues
          const copyrightIndicators = ['cover', 'remix', 'sample', 'tribute'];
          const hasCopyright = copyrightIndicators.some(indicator =>
            content.name?.toLowerCase().includes(indicator) ||
            content.description?.toLowerCase().includes(indicator)
          );
          
          if (hasCopyright) {
            return {
              matches: true,
              reason: 'Potential copyright issue detected',
            };
          }
        }
        break;
    }

    return { matches: false, reason: '' };
  }

  /**
   * Check if content matches a specific filter
   */
  private async checkFilter(filter: ContentFilter, content: any): Promise<{
    matches: boolean;
    reason: string;
  }> {
    switch (filter.type) {
      case 'explicit_lyrics':
        // Check for explicit lyrics indicators
        const explicitTerms = ['explicit', 'profanity', 'adult content'];
        const hasExplicit = explicitTerms.some(term =>
          content.name?.toLowerCase().includes(term) ||
          content.description?.toLowerCase().includes(term)
        );
        
        if (hasExplicit) {
          return {
            matches: true,
            reason: 'Contains explicit lyrics',
          };
        }
        break;

      case 'inappropriate_content':
        // Check for inappropriate content
        const inappropriateTerms = ['inappropriate', 'offensive', 'hate'];
        const hasInappropriate = inappropriateTerms.some(term =>
          content.name?.toLowerCase().includes(term) ||
          content.description?.toLowerCase().includes(term)
        );
        
        if (hasInappropriate) {
          return {
            matches: true,
            reason: 'Contains inappropriate content',
          };
        }
        break;

      case 'copyright_issue':
        // Check for copyright issues
        const copyrightTerms = ['cover', 'remix', 'sample'];
        const hasCopyright = copyrightTerms.some(term =>
          content.name?.toLowerCase().includes(term) ||
          content.description?.toLowerCase().includes(term)
        );
        
        if (hasCopyright) {
          return {
            matches: true,
            reason: 'Potential copyright issue',
          };
        }
        break;

      case 'quality_issue':
        // Check for quality issues
        const qualityTerms = ['demo', 'rough', 'unfinished'];
        const hasQuality = qualityTerms.some(term =>
          content.name?.toLowerCase().includes(term) ||
          content.description?.toLowerCase().includes(term)
        );
        
        if (hasQuality) {
          return {
            matches: true,
            reason: 'Low quality content detected',
          };
        }
        break;
    }

    return { matches: false, reason: '' };
  }

  /**
   * Create a moderation action
   */
  async createModerationAction(
    type: 'block' | 'flag' | 'review' | 'allow',
    targetType: 'track' | 'artist' | 'playlist' | 'user',
    targetId: string,
    reason: string,
    moderatorId?: string,
    automated: boolean = false
  ): Promise<ModerationAction> {
    const action: ModerationAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      targetType,
      targetId,
      reason,
      moderatorId,
      automated,
      timestamp: new Date(),
      status: 'pending',
    };

    this.actions.push(action);

    // Apply the action
    await this.applyModerationAction(action);

    return action;
  }

  /**
   * Apply a moderation action
   */
  private async applyModerationAction(action: ModerationAction): Promise<void> {
    switch (action.type) {
      case 'block':
        // Block the content from radio
        await this.blockTrack(action.targetId);
        break;

      case 'flag':
        // Flag the content for review
        await this.flagContent(action.targetId, action.targetType, action.reason);
        break;

      case 'review':
        // Mark for manual review
        await this.markForReview(action.targetId, action.targetType, action.reason);
        break;

      case 'allow':
        // Allow the content
        action.status = 'approved';
        break;
    }
  }

  /**
   * Block a track from radio
   */
  private async blockTrack(trackId: string): Promise<void> {
    try {
      // Update NFT to not be radio eligible
      await prisma.nFT.update({
        where: { id: trackId },
        data: { 
          // Note: isRadioEligible field doesn't exist in schema, 
          // this would need to be added to the database schema
          // For now, we'll just log the action
        },
      });

      console.log(`Track ${trackId} blocked from radio`);
    } catch (error) {
      console.error('Failed to block track:', error);
    }
  }

  /**
   * Block an artist from radio
   */
  private async blockArtist(artistId: string): Promise<void> {
    try {
      // Get all NFTs by this artist
      const nfts = await prisma.nFT.findMany({
        where: { userId: artistId },
      });

      // Block all their tracks
      await Promise.all(
        nfts.map((nft: any) => this.blockTrack(nft.id))
      );
    } catch (error) {
      console.error('Failed to block artist:', error);
    }
  }

  /**
   * Block a playlist from radio
   */
  private async blockPlaylist(playlistId: string): Promise<void> {
    try {
      // Remove playlist from radio rotation
      // Note: removePlaylist method doesn't exist in PlaylistManager
      // This would need to be implemented
      console.log(`Playlist ${playlistId} blocked from radio`);
    } catch (error) {
      console.error('Failed to block playlist:', error);
    }
  }

  /**
   * Flag content for review
   */
  private async flagContent(
    targetId: string,
    targetType: string,
    reason: string
  ): Promise<void> {
    // This would typically create a review task
    console.log(`Content flagged for review: ${targetType} ${targetId} - ${reason}`);
  }

  /**
   * Mark content for manual review
   */
  private async markForReview(
    targetId: string,
    targetType: string,
    reason: string
  ): Promise<void> {
    // This would create a review queue item
    console.log(`Content marked for review: ${targetType} ${targetId} - ${reason}`);
  }

  /**
   * Create a safety report
   */
  async createSafetyReport(
    reporterId: string,
    reporterName: string,
    targetType: 'track' | 'artist' | 'playlist' | 'user',
    targetId: string,
    targetName: string,
    reason: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<SafetyReport> {
    const report: SafetyReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reporterId,
      reporterName,
      targetType,
      targetId,
      targetName,
      reason,
      description,
      severity,
      status: 'pending',
      createdAt: new Date(),
    };

    this.reports.push(report);

    // If severity is high or critical, take immediate action
    if (severity === 'high' || severity === 'critical') {
      await this.handleHighSeverityReport(report);
    }

    return report;
  }

  /**
   * Handle high severity reports
   */
  private async handleHighSeverityReport(report: SafetyReport): Promise<void> {
    // Take immediate action for high severity reports
    if (report.severity === 'critical') {
      await this.createModerationAction(
        'block',
        report.targetType,
        report.targetId,
        `Critical safety report: ${report.reason}`,
        undefined,
        true
      );
    } else if (report.severity === 'high') {
      await this.createModerationAction(
        'review',
        report.targetType,
        report.targetId,
        `High severity safety report: ${report.reason}`,
        undefined,
        true
      );
    }
  }

  /**
   * Get moderation rules
   */
  getRules(): ModerationRule[] {
    return [...this.rules];
  }

  /**
   * Get content filters
   */
  getFilters(): ContentFilter[] {
    return [...this.filters];
  }

  /**
   * Get moderation actions
   */
  getActions(limit: number = 50): ModerationAction[] {
    return this.actions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get safety reports
   */
  getReports(limit: number = 50): SafetyReport[] {
    return this.reports
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Update moderation rule
   */
  updateRule(ruleId: string, updates: Partial<ModerationRule>): void {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = {
        ...this.rules[ruleIndex],
        ...updates,
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Update content filter
   */
  updateFilter(filterId: string, updates: Partial<ContentFilter>): void {
    const filterIndex = this.filters.findIndex(f => f.id === filterId);
    if (filterIndex !== -1) {
      this.filters[filterIndex] = {
        ...this.filters[filterIndex],
        ...updates,
      };
    }
  }

  /**
   * Review and approve/reject moderation action
   */
  async reviewAction(
    actionId: string,
    status: 'approved' | 'rejected',
    moderatorId: string
  ): Promise<void> {
    const action = this.actions.find(a => a.id === actionId);
    if (action) {
      action.status = status;
      
      if (status === 'rejected') {
        // Revert the action
        await this.revertModerationAction(action);
      }
    }
  }

  /**
   * Revert a moderation action
   */
  private async revertModerationAction(action: ModerationAction): Promise<void> {
    switch (action.type) {
      case 'block':
        if (action.targetType === 'track') {
          try {
            await prisma.nFT.update({
              where: { id: action.targetId },
              data: { 
                // Note: isRadioEligible field doesn't exist in schema
                // This would need to be added to the database schema
              },
            });
            console.log(`Track ${action.targetId} unblocked from radio`);
          } catch (error) {
            console.error('Failed to unblock track:', error);
          }
        }
        break;
      // Add other revert logic as needed
    }
  }
}

export const moderationService = ModerationService.getInstance(); 