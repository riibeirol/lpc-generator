// Download component
import { state } from "../../state/state.js";
import { layers } from "../../canvas/renderer.js";
import {
  getAllCredits,
  creditsToCsv,
  creditsToTxt,
} from "../../utils/credits.js";
import { CollapsibleSection } from "../CollapsibleSection.js";
import { downloadFile, downloadAsPNG, getCanvasBlob } from "../../canvas/download.js";
import { importStateFromJSON, exportStateAsJSON } from "../../state/json.js";
import {
  exportSplitAnimations,
  exportSplitItemSheets,
  exportSplitItemAnimations,
  exportIndividualFrames,
} from "../../state/zip.js";
import { debugLog } from "../../utils/debug.js";

export const Download = {
  view: function () {
    // Export to clipboard
    const exportToClipboard = async () => {
      if (!window.canvasRenderer) return;
      try {
        const json = exportStateAsJSON(state, layers);
        debugLog(json);
        await navigator.clipboard.writeText(json);
        alert("Exported to clipboard!");
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
        alert("Failed to copy to clipboard. Please check browser permissions.");
      }
    };

    // Import from clipboard
    const importFromClipboard = async () => {
      if (!window.canvasRenderer) return;
      try {
        const json = await navigator.clipboard.readText();
        debugLog(json);
        const imported = importStateFromJSON(json);
        Object.assign(state, imported);

        m.redraw(); // Force Mithril to update the UI
        alert("Imported successfully!");
      } catch (err) {
        console.error("Failed to import from clipboard:", err);
        alert(
          "Failed to import. Please check clipboard content and browser permissions.",
        );
      }
    };

    // Save as PNG
    const saveAsPNG = () => {
      if (!window.canvasRenderer) return;

      // Export offscreen canvas directly
      downloadAsPNG("character-spritesheet.png");
    };

    // Enviar direto pro rsabox via edge function pública (relay no Supabase).
    // Substituiu o antigo localhost:8022 — funciona de qualquer máquina.
    const RSABOX_RELAY = "https://bribmcfqbmhgktjfkbje.supabase.co/functions/v1/rsabox-sprite-relay";
    const sendToRsabox = async () => {
      if (!window.canvasRenderer) return;
      const params = new URLSearchParams(window.location.search);
      const userId = params.get("userId");
      if (!userId) {
        alert("Abra o LPC pelo botão 'Montar no LPC' dentro do rsabox.");
        return;
      }
      try {
        const blob = await getCanvasBlob();
        const reader = new FileReader();
        reader.onload = async e => {
          try {
            const res = await fetch(RSABOX_RELAY, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, data: e.target.result }),
            });
            if (!res.ok) throw new Error("falha no relay");
            if (window.opener) window.close();
            else alert("✓ Sprite enviado! Volte ao rsabox.");
          } catch (err) {
            console.error("Erro no relay:", err);
            alert("Erro ao enviar pro rsabox. Tente de novo em instantes.");
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Erro ao exportar:", err);
        alert("Erro ao exportar o sprite.");
      }
    };

    // Detecta se foi aberto pelo rsabox (tem userId na URL)
    const fromRsabox = new URLSearchParams(window.location.search).has("userId");

    return m(
      CollapsibleSection,
      {
        title: "Download",
        storageKey: "download",
        defaultOpen: true,
      },
      [
        m("div.buttons.is-flex.is-flex-wrap-wrap", { id: "download-buttons" }, [
          m(
            "button.button.is-small.is-primary",
            { onclick: saveAsPNG },
            "Spritesheet (PNG)",
          ),
          fromRsabox
            ? m(
                "button.button.is-small",
                {
                  onclick: sendToRsabox,
                  style: "background:#34d399;color:#000;font-weight:700;border:none;",
                },
                "✓ Enviar pro rsabox",
              )
            : null,
          m(
            "button.button.is-small",
            {
              onclick: () => {
                const allCredits = getAllCredits(
                  state.selections,
                  state.bodyType,
                );
                const txtContent = creditsToTxt(allCredits);
                downloadFile(txtContent, "credits.txt", "text/plain");
              },
            },
            "Credits (TXT)",
          ),
          m(
            "button.button.is-small",
            {
              onclick: () => {
                const allCredits = getAllCredits(
                  state.selections,
                  state.bodyType,
                );
                const csvContent = creditsToCsv(allCredits);
                downloadFile(csvContent, "credits.csv", "text/csv");
              },
            },
            "Credits (CSV)",
          ),
          m(
            "button.button.is-small.is-info",
            { onclick: exportSplitAnimations },
            "ZIP: Split by animation",
          ),
          state.zipByAnimation.isRunning ? m("span.loading") : null,
          m(
            "button.button.is-small.is-info",
            { onclick: exportSplitItemSheets },
            "ZIP: Split by item",
          ),
          state.zipByItem.isRunning ? m("span.loading") : null,
          m(
            "button.button.is-small.is-info",
            { onclick: exportSplitItemAnimations },
            "ZIP: Split by animation and item",
          ),
          state.zipByAnimimationAndItem.isRunning ? m("span.loading") : null,
          m(
            "button.button.is-small.is-info",
            { onclick: exportIndividualFrames },
            "ZIP: Split by animation and frame",
          ),
          state.zipIndividualFrames && state.zipIndividualFrames.isRunning
            ? m("span.loading")
            : null,
          m(
            "button.button.is-small.is-link",
            { onclick: exportToClipboard },
            "Export to Clipboard (JSON)",
          ),
          m(
            "button.button.is-small.is-link",
            { onclick: importFromClipboard },
            "Import from Clipboard (JSON)",
          ),
        ]),
      ],
    );
  },
};
