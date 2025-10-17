import puppeteer, { Browser, Page } from 'puppeteer';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface OnlyFansSession {
  userId: string;
  cookies: string;
  userAgent: string;
  lastActive: Date;
}

export class OnlyFansScrapingClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private session: OnlyFansSession | null = null;

  constructor(private encryptionKey: string) {}

  async initialize(session: OnlyFansSession) {
    this.session = session;
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent(session.userAgent);
    
    // Load cookies
    const decryptedCookies = this.decryptCookies(session.cookies);
    const cookies = JSON.parse(decryptedCookies);
    await this.page.setCookie(...cookies);
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Intercept requests to block unnecessary resources
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  async fetchMessages(limit = 50) {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      await this.page.goto('https://onlyfans.com/my/chats', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for messages to load
      await this.page.waitForSelector('.b-chats__item', { timeout: 10000 });

      // Extract conversations
      const conversations = await this.page.evaluate(() => {
        const items = document.querySelectorAll('.b-chats__item');
        const convos = [];
        
        items.forEach(item => {
          const username = item.querySelector('.g-user-name')?.textContent?.trim();
          const lastMessage = item.querySelector('.b-chats__message')?.textContent?.trim();
          const time = item.querySelector('.b-chats__time')?.textContent?.trim();
          const unread = !!item.querySelector('.b-chats__unread-count');
          const userId = item.getAttribute('data-user-id');
          
          if (username && userId) {
            convos.push({
              userId,
              username,
              lastMessage,
              time,
              unread
            });
          }
        });
        
        return convos;
      });

      // Save to database
      for (const convo of conversations.slice(0, limit)) {
        await this.saveConversation(convo);
      }

      return conversations;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async fetchConversationDetails(userId: string) {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      await this.page.goto(`https://onlyfans.com/my/chats/chat/${userId}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for messages
      await this.page.waitForSelector('.b-chat__message', { timeout: 10000 });
      
      // Scroll to load more messages
      await this.autoScroll(this.page);

      // Extract messages
      const messages = await this.page.evaluate(() => {
        const msgElements = document.querySelectorAll('.b-chat__message');
        const msgs = [];
        
        msgElements.forEach(elem => {
          const content = elem.querySelector('.b-chat__message__text')?.textContent?.trim();
          const isSent = elem.classList.contains('m-from-me');
          const time = elem.querySelector('.b-chat__message__time')?.textContent?.trim();
          const hasTip = !!elem.querySelector('.b-chat__tip');
          const tipAmount = elem.querySelector('.b-chat__tip__amount')?.textContent?.trim();
          
          if (content) {
            msgs.push({
              content,
              sender: isSent ? 'creator' : 'fan',
              time,
              hasTip,
              tipAmount: tipAmount ? parseFloat(tipAmount.replace(/[^0-9.]/g, '')) : 0
            });
          }
        });
        
        return msgs.reverse(); // Oldest first
      });

      // Get fan info
      const fanInfo = await this.page.evaluate(() => {
        const name = document.querySelector('.g-user-name')?.textContent?.trim();
        const avatar = document.querySelector('.g-avatar img')?.getAttribute('src');
        const isSubscribed = !!document.querySelector('.m-subscribed');
        const totalSpent = document.querySelector('.b-chat__header__sum')?.textContent?.trim();
        
        return {
          name,
          avatar,
          isSubscribed,
          totalSpent: totalSpent ? parseFloat(totalSpent.replace(/[^0-9.]/g, '')) : 0
        };
      });

      return {
        fanInfo,
        messages
      };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  async sendMessage(userId: string, message: string) {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      await this.page.goto(`https://onlyfans.com/my/chats/chat/${userId}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for input
      const inputSelector = '.b-chat__footer__input textarea';
      await this.page.waitForSelector(inputSelector, { timeout: 10000 });
      
      // Type message
      await this.page.click(inputSelector);
      await this.page.type(inputSelector, message, { delay: 50 });
      
      // Send
      const sendButton = '.b-chat__footer__submit button:not([disabled])';
      await this.page.waitForSelector(sendButton);
      await this.page.click(sendButton);
      
      // Wait for message to be sent
      await this.page.waitForFunction(
        (selector) => !document.querySelector(selector)?.value,
        {},
        inputSelector
      );

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getFanStats(userId: string) {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      // Navigate to user profile
      await this.page.goto(`https://onlyfans.com/${userId}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const stats = await this.page.evaluate(() => {
        // Extract subscription info
        const subPrice = document.querySelector('.b-offer__price')?.textContent?.trim();
        const joinDate = document.querySelector('.b-user__info__create')?.textContent?.trim();
        
        // Extract interaction stats
        const postsCount = document.querySelector('.b-tabs__nav__counter')?.textContent?.trim();
        const likesGiven = document.querySelectorAll('.b-post__likes.m-active').length;
        
        return {
          subscriptionPrice: subPrice ? parseFloat(subPrice.replace(/[^0-9.]/g, '')) : 0,
          joinDate,
          postsViewed: parseInt(postsCount || '0'),
          likesGiven
        };
      });

      return stats;
    } catch (error) {
      console.error('Error getting fan stats:', error);
      return null;
    }
  }

  private async autoScroll(page: Page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve(void 0);
          }
        }, 100);
      });
    });
  }

  private async saveConversation(convo: any) {
    const existingConvo = await prisma.conversation.findUnique({
      where: { fanId: convo.userId }
    });

    if (existingConvo) {
      await prisma.conversation.update({
        where: { fanId: convo.userId },
        data: {
          lastMessage: new Date(),
          lastMessageContent: convo.lastMessage
        }
      });
    } else {
      await prisma.conversation.create({
        data: {
          fanId: convo.userId,
          fanUsername: convo.username,
          creatorId: this.session!.userId,
          lastMessage: new Date(),
          lastMessageContent: convo.lastMessage,
          fanTier: 'new'
        }
      });
    }
  }

  private encryptCookies(cookies: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(cookies, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptCookies(encryptedCookies: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedCookies, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}