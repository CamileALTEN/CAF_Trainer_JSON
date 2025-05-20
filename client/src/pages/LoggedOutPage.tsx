import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

export default function LoggedOutPage() {
  const navigate = useNavigate();
  return (
    <Wrapper>
      <p>Vous êtes déconnecté.</p>
      <button onClick={() => navigate('/login')}>Se reconnecter</button>
    </Wrapper>
  );
}

const Wrapper = styled.div`  height:100vh;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  background:linear-gradient(135deg,#0f2027 0%, #203a43 50%, #2c5364 100%);
  button {
    padding:0.5rem 1rem;
    margin-top:1rem;
    background:linear-gradient(90deg,var(--primary-color),var(--primary-dark));
    color:white;
    border:none;
    border-radius:var(--radius);
    box-shadow:0 2px 4px rgba(0,0,0,.25);
    cursor:pointer;
    &:hover { background:linear-gradient(90deg,var(--primary-dark),var(--primary-color)); }
  }
      `;