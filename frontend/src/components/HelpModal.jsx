import React from 'react';

const rules = [
  { title: 'Tabuleiro', text: 'Jogo disputado em tabuleiro 8×8. Apenas as casas escuras são utilizadas.' },
  { title: 'Peças', text: 'Cada jogador começa com 12 peças nas três primeiras fileiras do seu lado.' },
  { title: 'Quem começa', text: 'As peças Vermelhas sempre jogam primeiro.' },
  { title: 'Movimento normal', text: 'Peças normais avançam uma casa na diagonal, somente em direção ao lado adversário.' },
  { title: 'Captura', text: 'Para capturar, pule sobre uma peça adversária na diagonal. A casa após ela deve estar vazia.' },
  { title: 'Captura obrigatória', text: 'Se houver possibilidade de capturar, você é obrigado a capturar. Não é opcional.' },
  { title: 'Captura múltipla', text: 'Se após uma captura houver outra disponível com a mesma peça, você deve continuar capturando no mesmo turno.' },
  { title: 'Promoção a Dama', text: 'Quando uma peça chega à última fileira do tabuleiro (lado adversário), ela vira Dama — marcada com ♛.' },
  { title: 'Movimento da Dama', text: 'A Dama pode mover e capturar em qualquer direção diagonal (frente e trás), uma casa por vez.' },
  { title: 'Condição de vitória', text: 'Vence quem eliminar todas as peças do adversário ou deixá-lo sem movimentos válidos.' },
  { title: 'Abandono', text: 'Ao abandonar a partida, você perde automaticamente e o adversário é declarado vencedor.' },
];

function HelpModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Regras do jogo">
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Regras do Jogo de Damas</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="modal-body">
          <ul className="rules-list">
            {rules.map(({ title, text }) => (
              <li key={title}>
                <strong>{title}:</strong> {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Entendido!</button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
