import React from 'react';
import { styled } from '@mui/material';
import { Avatar as MuiAvatar, AvatarProps as MuiAvatarProps } from '@mui/material';

const StyledAvatar = styled(MuiAvatar)(({ theme }) => ({
  display: 'flex',
  height: '40px',
  width: '40px',
  borderRadius: '50%',
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.grey[300],
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  ...theme.applyStyles?.('dark', {
    backgroundColor: theme.palette.grey[700],
  }),
}));

export  const getAvatarFallback = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");

export interface AvatarProps extends MuiAvatarProps {
  fallback?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, ...props }) => (
  <StyledAvatar src={src} alt={alt} {...props}>
    {!src && fallback}
  </StyledAvatar>
);