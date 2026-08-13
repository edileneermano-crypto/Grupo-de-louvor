/* =========================================================
   PRAISE GROUP - ESCALA
   Calendário + Escala semanal
========================================================= */

import {
    observarAutenticacao,
    listenEscalaDia,
    addPessoaEscalaFirestore,
    removePessoaEscalaFirestore
} from "../firebase.js";


document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS PRINCIPAIS
    ===================================================== */

    const botoesIgrejas = document.querySelectorAll(".igreja-card");
    const areaEscala = document.getElementById("areaEscala");

    let igrejaAtual = null;
    let dataAtual = new Date();
    let dataSelecionada = null;


    /* =====================================================
       VERIFICAÇÃO DOS ELEMENTOS
    ===================================================== */

    if (!areaEscala) {
        console.error(
            'Erro: elemento com id="areaEscala" não foi encontrado.'
        );
        return;
    }

    if (!botoesIgrejas.length) {
        console.warn(
            'Aviso: nenhum elemento com a classe ".igreja-card" foi encontrado.'
        );
    }


    /* =====================================================
       AUTENTICAÇÃO
    ===================================================== */

    try {
        if (typeof observarAutenticacao === "function") {
            observarAutenticacao();
        }
    } catch (erro) {
        console.error(
            "Erro ao iniciar autenticação:",
            erro
        );
    }


    /* =====================================================
       GERAR CHAVE DA DATA
    ===================================================== */

    function gerarDataKey(data) {

        const ano = data.getFullYear();

        const mes = String(
            data.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            data.getDate()
        ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }


    /* =====================================================
       FORMATAR DATA
    ===================================================== */

    function formatarData(data) {

        return data.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit"
            }
        );

    }


    /* =====================================================
       NOME DA IGREJA
    ===================================================== */

    function nomeDaIgreja(igreja) {

        const nomes = {

            "sede": "Sede",

            "marilena": "Marilena",

            "santa-lidia": "Santa Lidia"

        };

        return nomes[igreja] || igreja;

    }


    /* =====================================================
       SELECIONAR IGREJA
    ===================================================== */

    botoesIgrejas.forEach((botao) => {

        botao.addEventListener("click", () => {

            const igreja = botao.dataset.igreja;

            if (!igreja) {

                console.error(
                    "O card da igreja não possui data-igreja:",
                    botao
                );

                return;
            }


            igrejaAtual = igreja;

            dataAtual = new Date();

            dataSelecionada = null;


            console.log(
                "Igreja selecionada:",
                igrejaAtual
            );


            mostrarCalendario();

        });

    });


    /* =====================================================
       MOSTRAR CALENDÁRIO
    ===================================================== */

    function mostrarCalendario() {

        if (!igrejaAtual) {
            return;
        }


        const nomeIgreja =
            nomeDaIgreja(igrejaAtual);


        const mes =
            dataAtual.getMonth();


        const ano =
            dataAtual.getFullYear();


        const primeiroDia =
            new Date(
                ano,
                mes,
                1
            );


        const ultimoDia =
            new Date(
                ano,
                mes + 1,
                0
            );


        const primeiroDiaSemana =
            primeiroDia.getDay();


        const quantidadeDias =
            ultimoDia.getDate();


        const meses = [

            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro"

        ];


        let calendario = "";


        /* =================================================
           ESPAÇOS ANTES DO PRIMEIRO DIA
        ================================================= */

        for (
            let i = 0;
            i < primeiroDiaSemana;
            i++
        ) {

            calendario += `
                <div class="dia-vazio"></div>
            `;

        }


        /* =================================================
           DIAS DO MÊS
        ================================================= */

        for (
            let dia = 1;
            dia <= quantidadeDias;
            dia++
        ) {

            const data =
                new Date(
                    ano,
                    mes,
                    dia
                );


            const hoje =
                new Date();


            const ehHoje =
                data.toDateString() ===
                hoje.toDateString();


            const selecionado =
                dataSelecionada &&
                data.toDateString() ===
                dataSelecionada.toDateString();


            calendario += `

                <button
                    type="button"
                    class="dia-calendario
                    ${ehHoje ? "hoje" : ""}
                    ${selecionado ? "selecionado" : ""}"
                    data-dia="${dia}"
                >
                    ${dia}
                </button>

            `;

        }


        /* =================================================
           HTML DO CALENDÁRIO
        ================================================= */

        areaEscala.innerHTML = `

            <div class="escala-topo">

                <div>

                    <h2>
                        Escala - ${escapeHTML(nomeIgreja)}
                    </h2>

                    <p>
                        Selecione uma data para visualizar
                        a escala da semana.
                    </p>

                </div>


                <button
                    class="btn-voltar-igrejas"
                    id="voltarIgrejas"
                    type="button"
                >
                    ← Igrejas
                </button>

            </div>


            <div class="calendario">

                <div class="calendario-navegacao">

                    <button
                        type="button"
                        id="mesAnterior"
                    >
                        ‹
                    </button>


                    <h3>
                        ${meses[mes]} ${ano}
                    </h3>


                    <button
                        type="button"
                        id="mesProximo"
                    >
                        ›
                    </button>

                </div>


                <div class="dias-semana">

                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>

                </div>


                <div class="dias-grid">

                    ${calendario}

                </div>

            </div>


            <div
                id="escalaSemana"
                class="escala-semana"
            >

                <div class="semana-vazia">

                    <h3>
                        Escolha uma data
                    </h3>

                    <p>
                        Clique em um dia do calendário
                        para visualizar a escala da semana.
                    </p>

                </div>

            </div>

        `;


        /* =================================================
           MÊS ANTERIOR
        ================================================= */

        const mesAnterior =
            document.getElementById(
                "mesAnterior"
            );


        mesAnterior?.addEventListener(
            "click",
            () => {

                dataAtual =
                    new Date(
                        dataAtual.getFullYear(),
                        dataAtual.getMonth() - 1,
                        1
                    );


                mostrarCalendario();

            }
        );


        /* =================================================
           MÊS PRÓXIMO
        ================================================= */

        const mesProximo =
            document.getElementById(
                "mesProximo"
            );


        mesProximo?.addEventListener(
            "click",
            () => {

                dataAtual =
                    new Date(
                        dataAtual.getFullYear(),
                        dataAtual.getMonth() + 1,
                        1
                    );


                mostrarCalendario();

            }
        );


        /* =================================================
           VOLTAR PARA IGREJAS
        ================================================= */

        const voltarIgrejas =
            document.getElementById(
                "voltarIgrejas"
            );


        voltarIgrejas?.addEventListener(
            "click",
            () => {

                igrejaAtual = null;

                dataSelecionada = null;

                areaEscala.innerHTML = `

                    <div class="mensagem-inicial">

                        <div class="icone-calendario">
                            📅
                        </div>

                        <h3>
                            Selecione uma igreja
                        </h3>

                        <p>
                            Escolha uma das igrejas acima
                            para visualizar e organizar a escala.
                        </p>

                    </div>

                `;

            }
        );


        /* =================================================
           CLICAR NA DATA
        ================================================= */

        document
            .querySelectorAll(".dia-calendario")
            .forEach((botao) => {

                botao.addEventListener(
                    "click",
                    () => {

                        const dia =
                            Number(
                                botao.dataset.dia
                            );


                        dataSelecionada =
                            new Date(
                                ano,
                                mes,
                                dia
                            );


                        mostrarEscalaSemana();

                    }
                );

            });

    }


    /* =====================================================
       CALCULAR INÍCIO DA SEMANA
    ===================================================== */

    function obterInicioSemana(data) {

        const inicio =
            new Date(data);


        const dia =
            inicio.getDay();


        inicio.setDate(
            inicio.getDate() - dia
        );


        inicio.setHours(
            0,
            0,
            0,
            0
        );


        return inicio;

    }


    /* =====================================================
       MOSTRAR ESCALA DA DATA SELECIONADA
    ===================================================== */

    async function mostrarEscalaSemana() {

        const container =
            document.getElementById(
                "escalaSemana"
            );


        if (
            !container ||
            !dataSelecionada ||
            !igrejaAtual
        ) {

            return;

        }


        const data =
            new Date(
                dataSelecionada
            );


        const dias = [

            "Domingo",
            "Segunda-feira",
            "Terça-feira",
            "Quarta-feira",
            "Quinta-feira",
            "Sexta-feira",
            "Sábado"

        ];


        const diaSemana =
            dias[data.getDay()];


        const dataFormatada =
            formatarData(data);


        const dataKey =
            gerarDataKey(data);


        container.innerHTML = `

            <div class="semana-header">

                <div>

                    <h2>
                        Escala
                    </h2>

                    <p>
                        ${diaSemana} - ${dataFormatada}
                    </p>

                </div>


                <button
                    class="btn-adicionar"
                    id="btnAdicionarEscala"
                    type="button"
                >
                    + Adicionar
                </button>

            </div>


            <div class="dias-escala">

                <div class="dia-escala">

                    <div class="dia-escala-header">

                        <strong>
                            ${diaSemana}
                        </strong>

                        <span>
                            ${dataFormatada}
                        </span>

                    </div>


                    <div
                        class="pessoas-escala"
                        id="pessoasEscala"
                        data-data="${dataKey}"
                    >

                        <p class="sem-escala">
                            Carregando escala...
                        </p>

                    </div>

                </div>

            </div>

        `;


        /* =================================================
           BOTÃO ADICIONAR
        ================================================= */

        const btnAdicionar =
            document.getElementById(
                "btnAdicionarEscala"
            );


        btnAdicionar?.addEventListener(
            "click",
            abrirFormularioEscala
        );


        /* =================================================
           CONTAINER DAS PESSOAS
        ================================================= */

        const pessoasContainer =
            document.getElementById(
                "pessoasEscala"
            );


        /* =================================================
           BUSCAR ESCALA NO FIREBASE
        ================================================= */

        try {

            listenEscalaDia(
                igrejaAtual,
                dataKey,
                (pessoas) => {

                    if (!pessoasContainer) {
                        return;
                    }


                    if (
                        !pessoas ||
                        !pessoas.length
                    ) {

                        pessoasContainer.innerHTML = `

                            <p class="sem-escala">
                                Nenhuma pessoa adicionada.
                            </p>

                        `;

                        return;

                    }


                    pessoasContainer.innerHTML =
                        pessoas
                            .map(
                                (pessoa) => `

                                    <div
                                        class="pessoa-escala"
                                        data-id="${escapeHTML(pessoa.id)}"
                                    >

                                        <div>

                                            <strong>
                                                ${escapeHTML(
                                                    pessoa.nome || ""
                                                )}
                                            </strong>

                                            <span>
                                                ${escapeHTML(
                                                    pessoa.funcao || ""
                                                )}
                                            </span>

                                        </div>


                                        <button
                                            class="btn-remover"
                                            type="button"
                                            data-id="${escapeHTML(pessoa.id)}"
                                        >
                                            Remover
                                        </button>

                                    </div>

                                `
                            )
                            .join("");


                    /* =================================================
                       BOTÕES REMOVER
                    ================================================= */

                    pessoasContainer
                        .querySelectorAll(
                            ".btn-remover"
                        )
                        .forEach(
                            (botao) => {

                                botao.addEventListener(
                                    "click",
                                    async () => {

                                        const pessoaId =
                                            botao.dataset.id;


                                        if (!pessoaId) {
                                            return;
                                        }


                                        try {

                                            await removePessoaEscalaFirestore(
                                                igrejaAtual,
                                                dataKey,
                                                pessoaId
                                            );

                                        } catch (erro) {

                                            console.error(
                                                "Erro ao remover pessoa:",
                                                erro
                                            );


                                            alert(
                                                "Não foi possível remover a pessoa."
                                            );

                                        }

                                    }
                                );

                            }
                        );

                }
            );

        } catch (erro) {

            console.error(
                "Erro ao buscar escala:",
                erro
            );


            if (pessoasContainer) {

                pessoasContainer.innerHTML = `

                    <p class="sem-escala">
                        Não foi possível carregar a escala.
                    </p>

                `;

            }

        }

    }


    /* =====================================================
       FORMULÁRIO PARA ADICIONAR
    ===================================================== */

    function abrirFormularioEscala() {

        const container =
            document.getElementById(
                "escalaSemana"
            );


        if (!container) {
            return;
        }


        /* Evita abrir dois formulários */

        const formularioExistente =
            container.querySelector(
                ".formulario-escala"
            );


        if (formularioExistente) {
            return;
        }


        const formulario =
            document.createElement(
                "div"
            );


        formulario.className =
            "formulario-escala";


        formulario.innerHTML = `

            <h3>
                Adicionar à escala
            </h3>


            <div class="form-grid">

                <div>

                    <label for="nomeEscala">
                        Nome
                    </label>

                    <input
                        type="text"
                        id="nomeEscala"
                        placeholder="Nome da pessoa"
                    >

                </div>


                <div>

                    <label for="funcaoEscala">
                        Função
                    </label>

                    <select id="funcaoEscala">

                        <option value="">
                            Selecione
                        </option>

                        <option value="Vocal">
                            Vocal
                        </option>

                        <option value="Ministração">
                            Ministração
                        </option>

                        <option value="Teclado">
                            Teclado
                        </option>

                        <option value="Violão">
                            Violão
                        </option>

                        <option value="Guitarra">
                            Guitarra
                        </option>

                        <option value="Baixo">
                            Baixo
                        </option>

                        <option value="Bateria">
                            Bateria
                        </option>

                        <option value="Multimídia">
                            Multimídia
                        </option>

                    </select>

                </div>


                <div>

                    <label for="diaEscala">
                        Dia
                    </label>

                    <select id="diaEscala">

                        ${gerarOpcoesDias()}

                    </select>

                </div>

            </div>


            <div class="form-acoes">

                <button
                    class="btn-cancelar"
                    id="cancelarEscala"
                    type="button"
                >
                    Cancelar
                </button>


                <button
                    class="btn-salvar"
                    id="salvarEscala"
                    type="button"
                >
                    Adicionar
                </button>

            </div>

        `;


        container.prepend(
            formulario
        );


        /* =================================================
           CANCELAR
        ================================================= */

        document
            .getElementById(
                "cancelarEscala"
            )
            ?.addEventListener(
                "click",
                () => {

                    formulario.remove();

                }
            );


        /* =================================================
           SALVAR
        ================================================= */

        document
            .getElementById(
                "salvarEscala"
            )
            ?.addEventListener(
                "click",
                () => {

                    salvarPessoaEscala(
                        formulario
                    );

                }
            );


        /* Coloca o cursor no nome */

        document
            .getElementById(
                "nomeEscala"
            )
            ?.focus();

    }


    /* =====================================================
       OPÇÕES DOS DIAS DA SEMANA
    ===================================================== */

    function gerarOpcoesDias() {

        if (!dataSelecionada) {
            return "";
        }


        const inicio =
            obterInicioSemana(
                dataSelecionada
            );


        const nomes = [

            "Domingo",
            "Segunda-feira",
            "Terça-feira",
            "Quarta-feira",
            "Quinta-feira",
            "Sexta-feira",
            "Sábado"

        ];


        let html = "";


        for (
            let i = 0;
            i < 7;
            i++
        ) {

            const data =
                new Date(inicio);


            data.setDate(
                inicio.getDate() + i
            );


            /* =================================================
               IMPORTANTE:
               Não usar toISOString() aqui.
               Ele pode mudar o dia por causa do fuso.
            ================================================= */

            const dataKey =
                gerarDataKey(data);


            html += `

                <option value="${dataKey}">

                    ${nomes[i]}
                    -
                    ${formatarData(data)}

                </option>

            `;

        }


        return html;

    }


    /* =====================================================
       SALVAR PESSOA NA ESCALA
    ===================================================== */

    async function salvarPessoaEscala(
        formulario
    ) {

        const nomeInput =
            document.getElementById(
                "nomeEscala"
            );


        const funcaoInput =
            document.getElementById(
                "funcaoEscala"
            );


        const diaInput =
            document.getElementById(
                "diaEscala"
            );


        const nome =
            nomeInput?.value.trim();


        const funcao =
            funcaoInput?.value;


        const dia =
            diaInput?.value;


        /* =================================================
           VALIDAÇÕES
        ================================================= */

        if (!nome) {

            alert(
                "Digite o nome da pessoa."
            );

            nomeInput?.focus();

            return;

        }


        if (!funcao) {

            alert(
                "Selecione a função."
            );

            funcaoInput?.focus();

            return;

        }


        if (!dia) {

            alert(
                "Selecione o dia."
            );

            diaInput?.focus();

            return;

        }


        if (!igrejaAtual) {

            alert(
                "Nenhuma igreja selecionada."
            );

            return;

        }


        const dataKey =
            dia;


        try {

            await addPessoaEscalaFirestore(
                igrejaAtual,
                dataKey,
                {
                    nome: nome,
                    funcao: funcao
                }
            );


            formulario.remove();


            console.log(
                "Pessoa adicionada:",
                {
                    igreja: igrejaAtual,
                    data: dataKey,
                    nome: nome,
                    funcao: funcao
                }
            );

        } catch (erro) {

            console.error(
                "Erro ao salvar escala:",
                erro
            );


            alert(
                "Não foi possível salvar a pessoa na escala."
            );

        }

    }


    /* =====================================================
       SEGURANÇA DO TEXTO
    ===================================================== */

    function escapeHTML(texto) {

        return String(texto)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* =====================================================
       FINALIZAÇÃO
    ===================================================== */

    console.log(
        "Praise Group - Escala carregado com sucesso."
    );

});