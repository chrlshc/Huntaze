// Reddit Rules Loader - Parse YAML config for subreddit rules
// Compatible with reddit-automation.ts

import { SubredditRules } from './reddit-automation';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

interface YAMLSubredditRules {
  requiresNSFW: boolean;
  allowsLinks: boolean;
  linkInFirstCommentOnly: boolean;
  requiresFlair: boolean;
  availableFlairs?: string[];
  titleFormat?: string;
  bannedWords: string[];
  requiresVerification: boolean;
  verificationFormat?: string;
  cooldownHours?: number;
  minKarma?: number;
  minAccountAge?: number;
  bestTimes?: string[];
  notes?: string;
  heightWeightRequired?: boolean;
  maxHeight?: string;
  maxWeight?: string;
  ageRequired?: number;
  ethnicityRequired?: string;
  mustBeFunny?: boolean;
}

interface YAMLConfig {
  [key: string]: YAMLSubredditRules | any;
}

export class RedditRulesLoader {
  private rulesCache: Map<string, SubredditRules> = new Map();
  private configPath: string;
  
  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config', 'subreddit-rules.yaml');
    this.loadRules();
  }
  
  // Load rules from YAML file
  private loadRules(): void {
    try {
      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      const config = yaml.load(fileContents) as YAMLConfig;
      
      // Parse each subreddit
      Object.entries(config).forEach(([name, rules]) => {
        // Skip non-subreddit entries
        if (name === 'general_rules' || name === 'banned_globally' || 
            name === 'reddit_wide_rules' || name === 'conversion_tips') {
          return;
        }
        
        // Convert YAML format to our SubredditRules interface
        const subredditRules: SubredditRules = {
          name,
          requiresNSFW: rules.requiresNSFW || false,
          requiresFlair: rules.requiresFlair ? (rules.availableFlairs?.[0] || 'Required') : null,
          allowsLinks: rules.allowsLinks || false,
          linkInFirstCommentOnly: rules.linkInFirstCommentOnly || false,
          requiresVerification: rules.requiresVerification || false,
          verificationFormat: rules.verificationFormat,
          minAccountAge: rules.minAccountAge,
          minKarma: rules.minKarma,
          cooldownHours: rules.cooldownHours,
          bannedWords: rules.bannedWords || [],
          titleFormat: rules.titleFormat,
          allowsCrosspost: true, // Not in YAML, default true
          bestPostingTimes: this.parseBestTimes(rules.bestTimes || [])
        };
        
        this.rulesCache.set(name, subredditRules);
      });
      
      console.log(`Loaded rules for ${this.rulesCache.size} subreddits`);
    } catch (error) {
      console.error('Error loading Reddit rules:', error);
      // Fallback to hardcoded rules if YAML fails
    }
  }
  
  // Parse time strings like "22:00-02:00 EST" to hour numbers
  private parseBestTimes(times: string[]): number[] {
    const hours: number[] = [];
    
    times.forEach(timeRange => {
      const match = timeRange.match(/(\d{1,2}):\d{2}/);
      if (match) {
        hours.push(parseInt(match[1]));
      }
    });
    
    return hours.length > 0 ? hours : [10, 15, 20, 23];
  }
  
  // Get rules for a specific subreddit
  getRules(subredditName: string): SubredditRules | undefined {
    return this.rulesCache.get(subredditName);
  }
  
  // Get all loaded rules
  getAllRules(): Map<string, SubredditRules> {
    return this.rulesCache;
  }
  
  // Get subreddits by criteria
  findSubreddits(criteria: {
    minKarma?: number;
    requiresVerification?: boolean;
    allowsLinks?: boolean;
    niche?: string;
  }): string[] {
    const matches: string[] = [];
    
    this.rulesCache.forEach((rules, name) => {
      let isMatch = true;
      
      if (criteria.minKarma !== undefined && (rules.minKarma || 0) > criteria.minKarma) {
        isMatch = false;
      }
      
      if (criteria.requiresVerification !== undefined && 
          rules.requiresVerification !== criteria.requiresVerification) {
        isMatch = false;
      }
      
      if (criteria.allowsLinks !== undefined && 
          rules.allowsLinks !== criteria.allowsLinks) {
        isMatch = false;
      }
      
      // Simple niche matching based on subreddit name
      if (criteria.niche && !name.toLowerCase().includes(criteria.niche.toLowerCase())) {
        isMatch = false;
      }
      
      if (isMatch) {
        matches.push(name);
      }
    });
    
    return matches;
  }
  
  // Get global banned words
  getGlobalBannedWords(): string[] {
    // Hardcoded from YAML for now
    return [
      'underage', 'child', 'teen', 'rape', 'forced',
      'blood', 'violence', 'drugs', 'illegal'
    ];
  }
  
  // Get posting tips
  getPostingTips(): string[] {
    return [
      'First comment within 1 minute',
      'Reply to early comments for visibility',
      'Use reddit-hosted images (i.reddit)',
      'Post when Americans are horny (10pm-2am EST)',
      'Thank commenters to boost engagement',
      'Never mention prices publicly',
      'Build comment karma in SFW subs first',
      'Verify in multiple subs at once'
    ];
  }
  
  // Validate post against rules
  validatePost(
    subredditName: string,
    post: {
      title: string;
      hasLink: boolean;
      nsfw: boolean;
      accountAge?: number;
      karma?: number;
    }
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const rules = this.getRules(subredditName);
    if (!rules) {
      return {
        valid: false,
        errors: ['Unknown subreddit'],
        warnings: []
      };
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check requirements
    if (rules.requiresNSFW && !post.nsfw) {
      errors.push('NSFW tag required');
    }
    
    if (post.hasLink && !rules.allowsLinks && !rules.linkInFirstCommentOnly) {
      errors.push('No links allowed in this subreddit');
    }
    
    if (rules.minKarma && post.karma && post.karma < rules.minKarma) {
      errors.push(`Minimum ${rules.minKarma} karma required`);
    }
    
    if (rules.minAccountAge && post.accountAge && post.accountAge < rules.minAccountAge) {
      errors.push(`Account must be ${rules.minAccountAge} days old`);
    }
    
    // Check banned words
    const lowerTitle = post.title.toLowerCase();
    const bannedFound = rules.bannedWords.filter(word => 
      lowerTitle.includes(word.toLowerCase())
    );
    
    if (bannedFound.length > 0) {
      errors.push(`Banned words found: ${bannedFound.join(', ')}`);
    }
    
    // Check title format
    if (rules.titleFormat) {
      if (rules.titleFormat.includes('[F]') && !post.title.includes('[F]')) {
        warnings.push('Title should include [F] tag');
      }
    }
    
    if (rules.requiresVerification) {
      warnings.push(`Verification required: ${rules.verificationFormat || 'Check subreddit rules'}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Create singleton instance
export const redditRulesLoader = new RedditRulesLoader();

// Export helper functions
export function getSubredditRules(name: string): SubredditRules | undefined {
  return redditRulesLoader.getRules(name);
}

export function findEasySubreddits(currentKarma: number): string[] {
  return redditRulesLoader.findSubreddits({
    minKarma: currentKarma,
    requiresVerification: false
  });
}

export function validateRedditPost(
  subreddit: string,
  title: string,
  options: {
    hasLink?: boolean;
    nsfw?: boolean;
    accountAge?: number;
    karma?: number;
  } = {}
): { valid: boolean; errors: string[]; warnings: string[] } {
  return redditRulesLoader.validatePost(subreddit, {
    title,
    hasLink: options.hasLink || false,
    nsfw: options.nsfw !== false, // Default true for OF content
    accountAge: options.accountAge,
    karma: options.karma
  });
}