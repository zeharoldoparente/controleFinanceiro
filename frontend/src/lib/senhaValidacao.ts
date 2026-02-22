interface ValidacaoResultado {
   valida: boolean;
   erros: string[];
}

export function validarSenha(senha: string): ValidacaoResultado {
   const erros: string[] = [];

   if (senha.length < 8) {
      erros.push("Mínimo de 8 caracteres");
   }
   const sequenciasCrescentes = [
      "012",
      "123",
      "234",
      "345",
      "456",
      "567",
      "678",
      "789",
   ];
   for (const seq of sequenciasCrescentes) {
      if (senha.includes(seq)) {
         erros.push("Não pode conter sequências numéricas (ex: 123)");
         break;
      }
   }
   const sequenciasDecrescentes = [
      "210",
      "321",
      "432",
      "543",
      "654",
      "765",
      "876",
      "987",
   ];
   for (const seq of sequenciasDecrescentes) {
      if (senha.includes(seq)) {
         erros.push("Não pode conter sequências numéricas inversas (ex: 321)");
         break;
      }
   }
   const repetidos = /(.)\1{2,}/;
   if (repetidos.test(senha)) {
      erros.push(
         "Não pode conter 3 ou mais caracteres repetidos (ex: 111, aaa)",
      );
   }
   if (!/[a-zA-Z]/.test(senha)) {
      erros.push("Deve conter pelo menos uma letra");
   }
   if (!/[0-9]/.test(senha)) {
      erros.push("Deve conter pelo menos um número");
   }
   const senhasComuns = [
      "senha",
      "password",
      "123456",
      "qwerty",
      "abc123",
      "senha123",
      "admin",
      "letmein",
      "welcome",
   ];
   if (senhasComuns.some((comum) => senha.toLowerCase().includes(comum))) {
      erros.push("Senha muito comum, escolha outra");
   }

   return {
      valida: erros.length === 0,
      erros,
   };
}
export function forcaSenha(senha: string): "fraca" | "media" | "forte" {
   let pontos = 0;

   if (senha.length >= 8) pontos++;
   if (senha.length >= 12) pontos++;
   if (/[a-z]/.test(senha)) pontos++;
   if (/[A-Z]/.test(senha)) pontos++;
   if (/[0-9]/.test(senha)) pontos++;
   if (/[^a-zA-Z0-9]/.test(senha)) pontos++;

   if (pontos <= 2) return "fraca";
   if (pontos <= 4) return "media";
   return "forte";
}
