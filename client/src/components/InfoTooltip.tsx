import React from 'react';
import { Info } from 'lucide-react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  size?: number;
}

const Tooltip = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border: 1px solid #ddd;
  padding: 0.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  max-width: min(320px, 90vw);
  font-size: 0.875rem;
  line-height: 1.3;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
  z-index: 20;

  &::before {
    content: '';
    position: absolute;
    top: -5px;
    right: 12px;
    border: 5px solid transparent;
    border-bottom-color: #fff;
  }
`;

const Wrapper = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 0.25rem;

  &:hover ${Tooltip} {
    opacity: 1;
    visibility: visible;
  }
`;

const StyledInfo = styled(Info)`
  color: #555;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #008bd2;
  }
`;

const InfoTooltip: React.FC<Props> = ({ children, size = 16 }) => (
  <Wrapper>
    <StyledInfo size={size} />
    <Tooltip>{children}</Tooltip>
  </Wrapper>
);

export default InfoTooltip;
