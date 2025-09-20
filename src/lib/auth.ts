import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

// Hardcoded domain to bypass Render internal routing
function getNextAuthUrl() {
  // Always use production domain in production
  if (process.env.NODE_ENV === 'production') {
    return 'https://www.vinylfunders.com';
  }
  
  // Development fallback
  return 'http://localhost:3000';
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              image: true,
              isAdmin: true,
              recordLabel: true,
              recordLabelImage: true,
              subscriptionTier: true,
              aiMasteringCredits: true,
            }
          });

          if (!user) {
            throw new Error('No user found with this email');
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            throw new Error('Invalid password');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isAdmin: user.isAdmin,
            recordLabel: user.recordLabel,
            recordLabelImage: user.recordLabelImage,
            subscriptionTier: user.subscriptionTier,
            aiMasteringCredits: user.aiMasteringCredits,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.isAdmin = user.isAdmin;
        token.recordLabel = user.recordLabel;
        token.recordLabelImage = user.recordLabelImage;
        token.subscriptionTier = (user as any).subscriptionTier;
        token.aiMasteringCredits = (user as any).aiMasteringCredits;
      }

      // Refresh user data from database periodically or on update
      if (trigger === 'update' || !token.lastRefresh || Date.now() - (token.lastRefresh as number) > 5 * 60 * 1000) { // Refresh every 5 minutes
        try {
          console.log('🔄 JWT Callback: Refreshing user data from database', { trigger, userId: token.id });
          
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              isAdmin: true,
              recordLabel: true,
              recordLabelImage: true,
              subscriptionTier: true,
              subscriptionStatus: true,
              subscriptionEndDate: true,
              aiMasteringCredits: true,
              promotionalCredits: true,
              payAsYouGoCredits: true,
            }
          });

          if (freshUser) {
            // Log subscription changes for debugging
            if (token.subscriptionTier !== freshUser.subscriptionTier) {
              console.log('🎯 JWT Callback: Subscription tier changed', {
                oldTier: token.subscriptionTier,
                newTier: freshUser.subscriptionTier,
                userId: token.id
              });
            }
            
            if (token.aiMasteringCredits !== freshUser.aiMasteringCredits) {
              console.log('💎 JWT Callback: AI mastering credits changed', {
                oldCredits: token.aiMasteringCredits,
                newCredits: freshUser.aiMasteringCredits,
                userId: token.id
              });
            }

            token.id = freshUser.id;
            token.email = freshUser.email;
            token.name = freshUser.name;
            token.picture = freshUser.image;
            token.isAdmin = freshUser.isAdmin;
            token.recordLabel = freshUser.recordLabel;
            token.recordLabelImage = freshUser.recordLabelImage;
            token.subscriptionTier = freshUser.subscriptionTier;
            token.subscriptionStatus = freshUser.subscriptionStatus;
            token.subscriptionEndDate = freshUser.subscriptionEndDate;
            token.aiMasteringCredits = freshUser.aiMasteringCredits;
            token.promotionalCredits = freshUser.promotionalCredits;
            token.payAsYouGoCredits = freshUser.payAsYouGoCredits;
            token.lastRefresh = Date.now();
            
            console.log('✅ JWT Callback: User data refreshed successfully', {
              subscriptionTier: freshUser.subscriptionTier,
              aiMasteringCredits: freshUser.aiMasteringCredits,
              userId: token.id
            });
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
          // Don't fail the callback, just continue with cached data
        }
      }

      if (trigger === 'update' && session?.user) {
        token.picture = session.user.image;
        token.name = session.user.name;
        token.recordLabel = session.user.recordLabel;
        token.recordLabelImage = session.user.recordLabelImage;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
        (session.user as any).recordLabel = token.recordLabel as string | null;
        (session.user as any).recordLabelImage = token.recordLabelImage as string | null;
        (session.user as any).subscriptionTier = token.subscriptionTier as string | null;
        (session.user as any).subscriptionStatus = token.subscriptionStatus as string | null;
        (session.user as any).subscriptionEndDate = token.subscriptionEndDate as Date | null;
        (session.user as any).aiMasteringCredits = token.aiMasteringCredits as number | null;
        (session.user as any).promotionalCredits = token.promotionalCredits as number | null;
        (session.user as any).payAsYouGoCredits = token.payAsYouGoCredits as number | null;
        
        const isPlusMember = (token.subscriptionTier === 'plus' || token.subscriptionTier === 'gold');
        (session.user as any).isPlusMember = isPlusMember;
        
        // Log session creation for debugging subscription issues
        console.log('🔍 Session Callback: Creating session', {
          userId: session.user.id,
          subscriptionTier: token.subscriptionTier,
          aiMasteringCredits: token.aiMasteringCredits,
          isPlusMember
        });
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}; 