package kr.fanding.knowledgearchive;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Receives text shared into the app from other apps (a YouTube link, an article,
 * an answer copied out of an AI app).
 *
 * A share can arrive two ways: the app was launched by it (cold start), or it was
 * already running (onNewIntent). A cold start races the WebView, so the payload is
 * held here until the web layer asks for it with consume().
 */
@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {

    private static final String EVENT = "shareReceived";
    private JSObject pending;

    @Override
    public void load() {
        super.load();
        handle(getActivity().getIntent());
    }

    /** Called by MainActivity when a share arrives while the app is already open. */
    public void onNewShare(Intent intent) {
        handle(intent);
        if (pending != null) {
            notifyListeners(EVENT, pending);
            pending = null;
        }
    }

    /**
     * The web layer calls this once it is ready. Returns {value: null} when there
     * is nothing waiting, so the caller can branch without a separate check.
     */
    @PluginMethod
    public void consume(PluginCall call) {
        JSObject result = new JSObject();
        result.put("value", pending);
        pending = null;
        call.resolve(result);
    }

    private void handle(Intent intent) {
        if (intent == null) return;
        if (!Intent.ACTION_SEND.equals(intent.getAction())) return;
        if (intent.getType() == null || !intent.getType().startsWith("text/")) return;

        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null || text.trim().isEmpty()) return;

        JSObject payload = new JSObject();
        payload.put("text", text);
        payload.put("subject", intent.getStringExtra(Intent.EXTRA_SUBJECT));
        pending = payload;

        // Do not let a back navigation replay the same share.
        intent.setAction(null);
        intent.removeExtra(Intent.EXTRA_TEXT);
    }
}
