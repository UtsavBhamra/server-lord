import { jwtDecode } from "jwt-decode";
import { getSession, signIn, signOut } from "next-auth/react";

// Define user types
export interface UserSession {
  id: number;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

// Function to get the current session
export const getCurrentSession = async () => {
  return await getSession();
};

// Function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session;
};

// Function to get the token from session
export const getToken = async (): Promise<string | null> => {
  const session = await getCurrentSession();
  return session?.user.accessToken || null;
};

// Function to get the user info from session
export const getUserFromSession = async (): Promise<UserSession | null> => {
  const session = await getCurrentSession();
  if (!session) return null;
  
  try {
    // If you need to access JWT token data
    const token = session.user.accessToken;
    const decodedToken = jwtDecode<UserSession>(token);
    
    return {
      id: parseInt(session.user.id),
      username: session.user.name || '',
      email: session.user.email || '',
      iat: decodedToken.iat,
      exp: decodedToken.exp
    };
  } catch (error) {
    console.error("Error getting user from session:", error);
    return null;
  }
};

// Function to handle login
export const login = async (email: string, password: string): Promise<UserSession | null> => {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  });
  
  if (result?.error) {
    throw new Error(result.error);
  }
  
  return await getUserFromSession();
};

// Function to handle logout
export const logout = async (): Promise<void> => {
  await signOut({ callbackUrl: '/login' });
};