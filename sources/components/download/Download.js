// Painel "Enviar pro RSABOX" — versão enxuta.
// Removidos os botões de PNG, créditos, ZIP e clipboard: o único fluxo
// é montar o personagem e mandar pro Escritório Virtual do RSABOX.
import { CollapsibleSection } from "../CollapsibleSection.js";
import { getCanvasBlob } from "../../canvas/download.js";

const RSABOX_RELAY =
  "https://bribmcfqbmhgktjfkbje.supabase.co/functions/v1/rsabox-sprite-relay";

export const Download = {
  view: function () {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");

    const sendToRsabox = async () => {
      if (!window.canvasRenderer) return;
      if (!userId) {
        alert("Abra o montador pelo botão 'Montar no LPC' dentro do RSABOX.");
        return;
      }
      try {
        const blob = await getCanvasBlob();
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const res = await fetch(RSABOX_RELAY, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, data: e.target.result }),
            });
            if (!res.ok) throw new Error("falha no relay");
            if (window.opener) window.close();
            else alert("Personagem enviado! Volte ao RSABOX.");
          } catch (err) {
            console.error("Erro no relay:", err);
            alert("Erro ao enviar pro RSABOX. Tente de novo em instantes.");
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Erro ao exportar:", err);
        alert("Erro ao exportar o personagem.");
      }
    };

    return m(
      CollapsibleSection,
      {
        title: "Enviar pro RSABOX",
        storageKey: "download",
        defaultOpen: true,
      },
      [
        m("div.rsa-send-wrap", [
          m(
            "button.button.rsa-send-btn",
            { onclick: sendToRsabox },
            "Enviar pro RSABOX",
          ),
          !userId
            ? m(
                "span.rsa-send-hint",
                "Abra o montador pelo botão “Montar no LPC” dentro do RSABOX para liberar o envio.",
              )
            : null,
        ]),
      ],
    );
  },
};
