'use client';

export interface DiffResult {
  type: 'equal' | 'insert' | 'delete' | 'replace';
  serverValue: string;
  clientValue: string;
  path: string;
}

export interface HtmlComparisonResult {
  identical: boolean;
  differences: DiffResult[];
  summary: {
    totalDifferences: number;
    insertions: number;
    deletions: number;
    replacements: number;
  };
}

class HtmlDiffer {
  /**
   * Compare two HTML strings and return detailed differences
   */
  public compareHtml(serverHtml: string, clientHtml: string): HtmlComparisonResult {
    const result: HtmlComparisonResult = {
      identical: false,
      differences: [],
      summary: {
        totalDifferences: 0,
        insertions: 0,
        deletions: 0,
        replacements: 0,
      },
    };

    try {
      // Normalize HTML strings
      const normalizedServer = this.normalizeHtml(serverHtml);
      const normalizedClient = this.normalizeHtml(clientHtml);

      if (normalizedServer === normalizedClient) {
        result.identical = true;
        return result;
      }

      // Parse HTML into DOM-like structures for comparison
      const serverDoc = this.parseHtml(normalizedServer);
      const clientDoc = this.parseHtml(normalizedClient);

      // Compare the structures
      result.differences = this.compareNodes(serverDoc, clientDoc, '');
      
      // Calculate summary
      result.summary = this.calculateSummary(result.differences);
      result.identical = result.differences.length === 0;

    } catch (error) {
      console.warn('HTML comparison failed:', error);
      // Fallback to simple string comparison
      if (serverHtml !== clientHtml) {
        result.differences.push({
          type: 'replace',
          serverValue: serverHtml,
          clientValue: clientHtml,
          path: 'root',
        });
        result.summary.totalDifferences = 1;
        result.summary.replacements = 1;
      }
    }

    return result;
  }

  /**
   * Normalize HTML for better comparison
   */
  private normalizeHtml(html: string): string {
    return html
      .trim()
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/>\s+</g, '><')  // Remove whitespace between tags
      .replace(/\s+>/g, '>')  // Remove trailing whitespace in tags
      .replace(/\s+=/g, '=')  // Remove whitespace around attributes
      .toLowerCase();  // Case insensitive comparison
  }

  /**
   * Parse HTML string into a simple DOM-like structure
   */
  private parseHtml(html: string): ParsedNode {
    if (typeof window === 'undefined') {
      // Server-side fallback
      return this.parseHtmlFallback(html);
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<root>${html}</root>`, 'text/html');
      return this.domNodeToParsedNode(doc.body.firstChild as Element);
    } catch (error) {
      return this.parseHtmlFallback(html);
    }
  }

  /**
   * Fallback HTML parser for server-side or when DOMParser fails
   */
  private parseHtmlFallback(html: string): ParsedNode {
    // Simple regex-based parser for basic HTML
    const tagRegex = /<(\w+)([^>]*)>(.*?)<\/\1>|<(\w+)([^>]*)\s*\/?>|([^<]+)/g;
    const root: ParsedNode = {
      type: 'element',
      tagName: 'root',
      attributes: {},
      children: [],
      textContent: '',
    };

    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      if (match[1]) {
        // Opening and closing tag
        const node: ParsedNode = {
          type: 'element',
          tagName: match[1],
          attributes: this.parseAttributes(match[2] || ''),
          children: [],
          textContent: match[3] || '',
        };
        root.children.push(node);
      } else if (match[4]) {
        // Self-closing tag
        const node: ParsedNode = {
          type: 'element',
          tagName: match[4],
          attributes: this.parseAttributes(match[5] || ''),
          children: [],
          textContent: '',
        };
        root.children.push(node);
      } else if (match[6]) {
        // Text content
        const text = match[6].trim();
        if (text) {
          root.children.push({
            type: 'text',
            tagName: '',
            attributes: {},
            children: [],
            textContent: text,
          });
        }
      }
    }

    return root;
  }

  /**
   * Parse HTML attributes from string
   */
  private parseAttributes(attrString: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)=["']([^"']*)["']|(\w+)/g;
    
    let match;
    while ((match = attrRegex.exec(attrString)) !== null) {
      if (match[1]) {
        attributes[match[1]] = match[2];
      } else if (match[3]) {
        attributes[match[3]] = '';
      }
    }
    
    return attributes;
  }

  /**
   * Convert DOM node to parsed node structure
   */
  private domNodeToParsedNode(node: Node): ParsedNode {
    if (node.nodeType === Node.TEXT_NODE) {
      return {
        type: 'text',
        tagName: '',
        attributes: {},
        children: [],
        textContent: node.textContent || '',
      };
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const parsed: ParsedNode = {
        type: 'element',
        tagName: element.tagName.toLowerCase(),
        attributes: {},
        children: [],
        textContent: '',
      };

      // Extract attributes
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        parsed.attributes[attr.name] = attr.value;
      }

      // Extract children
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = this.domNodeToParsedNode(element.childNodes[i]);
        parsed.children.push(child);
      }

      return parsed;
    }

    // Fallback for other node types
    return {
      type: 'element',
      tagName: 'unknown',
      attributes: {},
      children: [],
      textContent: node.textContent || '',
    };
  }

  /**
   * Compare two parsed nodes recursively
   */
  private compareNodes(serverNode: ParsedNode, clientNode: ParsedNode, path: string): DiffResult[] {
    const differences: DiffResult[] = [];

    // Compare node types
    if (serverNode.type !== clientNode.type) {
      differences.push({
        type: 'replace',
        serverValue: `${serverNode.type}:${serverNode.tagName}`,
        clientValue: `${clientNode.type}:${clientNode.tagName}`,
        path: `${path}/type`,
      });
      return differences; // Don't continue if types differ
    }

    // Compare tag names
    if (serverNode.tagName !== clientNode.tagName) {
      differences.push({
        type: 'replace',
        serverValue: serverNode.tagName,
        clientValue: clientNode.tagName,
        path: `${path}/tagName`,
      });
    }

    // Compare text content for text nodes
    if (serverNode.type === 'text') {
      if (serverNode.textContent !== clientNode.textContent) {
        differences.push({
          type: 'replace',
          serverValue: serverNode.textContent,
          clientValue: clientNode.textContent,
          path: `${path}/text`,
        });
      }
      return differences;
    }

    // Compare attributes
    const serverAttrs = Object.keys(serverNode.attributes);
    const clientAttrs = Object.keys(clientNode.attributes);
    const allAttrs = new Set([...serverAttrs, ...clientAttrs]);

    allAttrs.forEach(attr => {
      const serverValue = serverNode.attributes[attr];
      const clientValue = clientNode.attributes[attr];

      if (serverValue !== clientValue) {
        if (serverValue === undefined) {
          differences.push({
            type: 'insert',
            serverValue: '',
            clientValue: clientValue,
            path: `${path}/@${attr}`,
          });
        } else if (clientValue === undefined) {
          differences.push({
            type: 'delete',
            serverValue: serverValue,
            clientValue: '',
            path: `${path}/@${attr}`,
          });
        } else {
          differences.push({
            type: 'replace',
            serverValue: serverValue,
            clientValue: clientValue,
            path: `${path}/@${attr}`,
          });
        }
      }
    });

    // Compare children
    const maxChildren = Math.max(serverNode.children.length, clientNode.children.length);
    
    for (let i = 0; i < maxChildren; i++) {
      const serverChild = serverNode.children[i];
      const clientChild = clientNode.children[i];
      const childPath = `${path}/${serverNode.tagName}[${i}]`;

      if (!serverChild && clientChild) {
        differences.push({
          type: 'insert',
          serverValue: '',
          clientValue: this.nodeToString(clientChild),
          path: childPath,
        });
      } else if (serverChild && !clientChild) {
        differences.push({
          type: 'delete',
          serverValue: this.nodeToString(serverChild),
          clientValue: '',
          path: childPath,
        });
      } else if (serverChild && clientChild) {
        differences.push(...this.compareNodes(serverChild, clientChild, childPath));
      }
    }

    return differences;
  }

  /**
   * Convert parsed node back to string representation
   */
  private nodeToString(node: ParsedNode): string {
    if (node.type === 'text') {
      return node.textContent;
    }

    const attrs = Object.entries(node.attributes)
      .map(([key, value]) => value ? `${key}="${value}"` : key)
      .join(' ');
    
    const attrString = attrs ? ` ${attrs}` : '';
    
    if (node.children.length === 0) {
      return `<${node.tagName}${attrString} />`;
    }
    
    const childrenString = node.children.map(child => this.nodeToString(child)).join('');
    return `<${node.tagName}${attrString}>${childrenString}</${node.tagName}>`;
  }

  /**
   * Calculate summary statistics from differences
   */
  private calculateSummary(differences: DiffResult[]) {
    const summary = {
      totalDifferences: differences.length,
      insertions: 0,
      deletions: 0,
      replacements: 0,
    };

    differences.forEach(diff => {
      switch (diff.type) {
        case 'insert':
          summary.insertions++;
          break;
        case 'delete':
          summary.deletions++;
          break;
        case 'replace':
          summary.replacements++;
          break;
      }
    });

    return summary;
  }

  /**
   * Generate a human-readable diff report
   */
  public generateDiffReport(result: HtmlComparisonResult): string {
    if (result.identical) {
      return 'HTML content is identical between server and client.';
    }

    let report = `HTML Comparison Report\n`;
    report += `======================\n\n`;
    report += `Summary:\n`;
    report += `- Total differences: ${result.summary.totalDifferences}\n`;
    report += `- Insertions: ${result.summary.insertions}\n`;
    report += `- Deletions: ${result.summary.deletions}\n`;
    report += `- Replacements: ${result.summary.replacements}\n\n`;

    if (result.differences.length > 0) {
      report += `Differences:\n`;
      result.differences.forEach((diff, index) => {
        report += `${index + 1}. ${diff.type.toUpperCase()} at ${diff.path}\n`;
        if (diff.type === 'replace') {
          report += `   Server: "${diff.serverValue}"\n`;
          report += `   Client: "${diff.clientValue}"\n`;
        } else if (diff.type === 'insert') {
          report += `   Added: "${diff.clientValue}"\n`;
        } else if (diff.type === 'delete') {
          report += `   Removed: "${diff.serverValue}"\n`;
        }
        report += `\n`;
      });
    }

    return report;
  }
}

interface ParsedNode {
  type: 'element' | 'text';
  tagName: string;
  attributes: Record<string, string>;
  children: ParsedNode[];
  textContent: string;
}

// Export singleton instance
export const htmlDiffer = new HtmlDiffer();

// Export class for testing
export { HtmlDiffer };