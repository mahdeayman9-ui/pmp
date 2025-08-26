import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@demo.com',
    name: 'John Admin',
    role: 'admin',
    username: 'admin'
  },
  {
    id: '2',
    email: 'manager@demo.com',
    name: 'Sarah Manager',
    role: 'manager',
    username: 'manager'
  },
  {
    id: '3',
    email: 'member@demo.com',
    name: 'Mike Member',
    role: 'member',
    username: 'member'
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(mockUsers);

  // دالة لإضافة مستخدم جديد
  const addUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // البحث بالإيميل أو اسم المستخدم
    const foundUser = users.find(u => 
      u.email === email || 
      u.username === email ||
      (u.generatedPassword && password === u.generatedPassword)
    );
    
    if (foundUser && (password === 'password' || password === foundUser.generatedPassword)) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, addUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};