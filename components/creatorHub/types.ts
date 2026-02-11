
import React from 'react';

export interface Creator {
  name: string;
  avatar: string;
  description: string;
  socials: SocialLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  price?: string;
  featured?: boolean;
}

export interface CTALink {
  title: string;
  icon: React.ReactNode;
  url: string;
  color: string;
}

export interface TrustBadge {
  label: string;
  icon: React.ReactNode;
}

export interface TimelineEntry {
  date: string;
  title: string;
  content: string;
  icon?: React.ReactNode;
}