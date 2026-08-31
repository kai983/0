package kr.fanding.knowledgearchive;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareTargetPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // launchMode is singleTask, so a share into a running app lands here
        // instead of going through onCreate.
        setIntent(intent);
        ShareTargetPlugin plugin = getBridge().getPlugin("ShareTarget") == null
            ? null
            : (ShareTargetPlugin) getBridge().getPlugin("ShareTarget").getInstance();
        if (plugin != null) {
            plugin.onNewShare(intent);
        }
    }
}
