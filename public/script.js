// Adicionando suporte dinâmico aos operadores e caminhões com base no retorno do doGet()
const apiURL =
  'https://script.google.com/macros/s/AKfycbzI-IPMj4Srr4jB3aYxgjv8Kyw8jX7R2BoKPtkom0CkgL75c3EKIjTFeAyJgFyosV7e_w/exec';

let todosRegistros = [];
let operadoresPorUPMR = {};
let caminhoesPorUPMRPeriodo = {};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(apiURL);
    const { registros, operadores, caminhoes } = await res.json();

    todosRegistros = registros || [];
    operadoresPorUPMR = agruparOperadores(operadores);
    caminhoesPorUPMRPeriodo = agruparCaminhoes(caminhoes);

    if (todosRegistros.length === 0) {
      document.getElementById('formulario-container').innerHTML =
        '<p>Sem registros pendentes.</p>';
      return;
    }

    preencherFiltros(todosRegistros);
    filtrarFormularios();
  } catch (err) {
    console.error('Erro ao carregar os dados:', err);
  }
});

function agruparOperadores(lista) {
  const agrupado = {};
  lista.forEach(({ upmr, nome }) => {
    if (!agrupado[upmr]) agrupado[upmr] = [];
    agrupado[upmr].push(nome);
  });
  return agrupado;
}

function agruparCaminhoes(lista) {
  const agrupado = {};
  lista.forEach(({ upmr, periodo, placa }) => {
    const chave = `${upmr}-${periodo}`;
    if (!agrupado[chave]) agrupado[chave] = [];
    agrupado[chave].push(placa);
  });
  return agrupado;
}

function filtrarFormularios() {
  const upmr = document.getElementById('filtro-upmr').value;
  const data = document.getElementById('filtro-data').value;
  const container = document.getElementById('formulario-container');
  container.innerHTML = '';

  const registrosFiltrados = todosRegistros.filter(
    (r) => (!upmr || r.UPMR === upmr) && (!data || r['Data da Coleta'] === data)
  );

  if (registrosFiltrados.length === 0) {
    container.innerHTML = '<p>Nenhum formulário encontrado.</p>';
    return;
  }

  registrosFiltrados.forEach((registro) => {
    const form = document.createElement('form');
    form.classList.add('formulario');

    // Preenchendo operador e placa com base nos mapas
    const operadores = operadoresPorUPMR[registro.UPMR] || [];
    const placas =
      caminhoesPorUPMRPeriodo[`${registro.UPMR}-${registro['Período']}`] || [];

    const operadorOptions = operadores
      .map((nome) => `<option value="${nome}">${nome}</option>`)
      .join('');

    const placa = placas.length > 0 ? placas[0] : '';

    form.innerHTML = `
      <h3>${registro.UPMR} - ${new Date(
      registro['Data da Coleta']
    ).toLocaleDateString('pt-BR')} (${registro['Período']})</h3>

      <label>Operador:</label>
      <select name="operador" required>
        <option value="">-- Selecione --</option>
        ${operadorOptions}
      </select>

      <label>Horário Início:</label>
      <input type="time" name="inicio" required>

      <label>Horário Fim:</label>
      <input type="time" name="fim" required>

      <label>Agenda foi atendida?</label>
      <select name="atendida" required>
        <option value="">-- Selecione --</option>
        <option>Atendido</option>
        <option>Atendido parcialmente</option>
        <option>Não atendido</option>
      </select>

      <label>Execução:</label>
      <select name="execucao" required>
        <option value="">-- Selecione --</option>
        <option>Executado por todo o setor e todas as ruas</option>
        <option>Executado parcialmente, com áreas sem atendimento</option>
        <option>Não atendeu setorização do dia</option>
      </select>

      <label>Velocidade padrão 10km/h?</label>
      <select name="velocidade" required>
        <option value="">-- Selecione --</option>
        <option>Sim</option>
        <option>Não</option>
      </select>

      <label>Paradas acima de 20 minutos?</label>
      <select name="ppi" required>
        <option value="">-- Selecione --</option>
        <option>Sim</option>
        <option>Não</option>
      </select>

      <label>Observações:</label>
      <textarea name="observacoes" rows="3"></textarea>

      <input type="hidden" name="_linha" value="${registro._linha}">
      <input type="hidden" name="upmr" value="${registro.UPMR}">
      <input type="hidden" name="placa" value="${placa}">
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

      const obrigatorios = [
        'operador',
        'inicio',
        'fim',
        'atendida',
        'execucao',
        'velocidade',
        'ppi',
      ];
      const invalido = obrigatorios.some(
        (campo) =>
          !formData.get(campo) || formData.get(campo) === '-- Selecione --'
      );

      if (invalido) {
        alert('Preencha todos os campos obrigatórios antes de enviar.');
        return;
      }

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
        observacao: formData.get('observacoes'),
        status: 'Preenchido',
        _linha: formData.get('_linha'),
      };

      try {
        await fetch(apiURL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        form.remove();
        const resposta = document.getElementById('resposta');
        resposta.style.display = 'block';
        resposta.innerHTML = `<strong>Registro enviado!</strong>`;
      } catch (err) {
        alert('Erro ao enviar os dados.');
        console.error(err);
      }
    });

    container.appendChild(form);
  });
}

function preencherFiltros(registros) {
  const filtroUPMR = document.getElementById('filtro-upmr');
  const filtroData = document.getElementById('filtro-data');

  const upmrs = [...new Set(registros.map((r) => r.UPMR))];
  const datas = [...new Set(registros.map((r) => r['Data da Coleta']))];

  upmrs.sort().forEach((u) => {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u;
    filtroUPMR.appendChild(opt);
  });

  datas.sort().forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = new Date(d).toLocaleDateString('pt-BR');
    filtroData.appendChild(opt);
  });
}
