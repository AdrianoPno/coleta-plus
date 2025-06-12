const apiURL =
  'https://script.google.com/macros/s/AKfycbzI-IPMj4Srr4jB3aYxgjv8Kyw8jX7R2BoKPtkom0CkgL75c3EKIjTFeAyJgFyosV7e_w/exec';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(apiURL);
    const dados = await res.json();

    const container = document.getElementById('formulario-container');
    if (dados.length === 0) {
      container.innerHTML = '<p>Sem registros pendentes.</p>';
      return;
    }

    dados.forEach((registro) => {
      const form = document.createElement('form');
      form.innerHTML = `
        <h3>${registro.UPMR} - ${registro['Data da Coleta']} (${registro.Período})</h3>
        
        <label>Operador:</label>
        <input type="text" name="operador" required>

        <label>Horário Início:</label>
        <input type="time" name="inicio" required>

        <label>Horário Fim:</label>
        <input type="time" name="fim" required>

        <label>Agenda foi atendida?</label>
        <select name="atendida" required>
          <option>Atendido</option>
          <option>Atendido parcialmente</option>
          <option>Não atendido</option>
        </select>

        <label>Execução:</label>
        <select name="execucao" required>
          <option>Executado por todo o setor e todas as ruas</option>
          <option>Executado parcialmente, com áreas sem atendimento</option>
          <option>Não atendeu setorização do dia</option>
        </select>

        <label>Velocidade padrão 10km/h?</label>
        <select name="velocidade" required>
          <option>Sim</option>
          <option>Não</option>
        </select>

        <label>Paradas acima de 20 minutos?</label>
        <select name="ppi" required>
          <option>Sim</option>
          <option>Não</option>
        </select>

        <label>Observações:</label>
        <textarea name="observacoes" rows="3"></textarea>

        <input type="hidden" name="_linha" value="${registro._linha}">
        <input type="hidden" name="upmr" value="${registro.UPMR}">
        <input type="hidden" name="placa" value="${registro.Caminhão}">
        <input type="hidden" name="data" value="${registro['Data da Coleta']}">
        <input type="hidden" name="periodo" value="${registro['Período']}">
        <input type="hidden" name="setor" value="${registro.Setor}">
        <input type="hidden" name="agenda" value="${registro['Dia da Semana']}">

        <button type="submit">Enviar</button>
        <hr>
      `;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = {
          timestamp: new Date().toISOString(),
          upmr: formData.get('upmr'),
          operador: formData.get('operador'),
          placa: formData.get('placa'),
          data: formData.get('data'),
          periodo: formData.get('periodo'),
          inicio: formData.get('inicio'),
          fim: formData.get('fim'),
          agenda: formData.get('agenda'),
          setor: formData.get('setor'),
          atendida: formData.get('atendida'),
          execucao: formData.get('execucao'),
          velocidade: formData.get('velocidade'),
          ppi: formData.get('ppi'),
          observacao: formData.get('observacao'), // <--- Corrigido aqui
          status: 'Preenchido',
          _linha: formData.get('_linha'),
        };

        try {
          await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          form.remove();
          const resposta = document.getElementById('resposta');
          resposta.style.display = 'block';
          resposta.innerHTML = `<strong>Registro enviado:</strong><br>${JSON.stringify(
            payload,
            null,
            2
          )}`;
        } catch (err) {
          alert('Erro ao enviar os dados.');
          console.error(err);
        }
      });

      container.appendChild(form);
    });
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
  }
});
