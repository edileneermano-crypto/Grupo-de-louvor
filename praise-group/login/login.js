import {
  entrar,
  observarAutenticacao
} from "../firebase.js";


document.addEventListener("DOMContentLoaded", () => {

  const loginSenha = document.getElementById("loginSenha");
  const btnEntrar = document.getElementById("btnEntrar");
  const loginMensagem = document.getElementById("loginMensagem");


  /* =====================================================
     VERIFICAR SE JÁ ESTÁ LOGADO
  ===================================================== */

  observarAutenticacao((usuario) => {

    if (usuario) {
      window.location.href = "../index.html";
    }

  });


  /* =====================================================
     ENTRAR
  ===================================================== */

  btnEntrar?.addEventListener("click", async () => {

    const senha = loginSenha.value;

    loginMensagem.textContent = "";


    if (!senha) {

      loginMensagem.textContent =
        "Digite a senha do grupo.";

      return;
    }


    btnEntrar.disabled = true;
    btnEntrar.textContent = "Entrando...";


    try {

      await entrar(senha);

      window.location.href = "../index.html";


    } catch (error) {

      console.error("Erro no login:", error);


      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {

        loginMensagem.textContent =
          "Senha incorreta.";

      } else {

        loginMensagem.textContent =
          "Não foi possível entrar. Tente novamente.";

      }


    } finally {

      btnEntrar.disabled = false;
      btnEntrar.textContent = "Entrar";

    }

  });


  /* =====================================================
     ENTER NO CAMPO DE SENHA
  ===================================================== */

  loginSenha?.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
      btnEntrar?.click();
    }

  });

});