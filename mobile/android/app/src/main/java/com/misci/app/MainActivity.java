package com.misci.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;
import android.widget.Toast;

import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;

public class MainActivity extends Activity {

    private WebView webView;
    private TextView statusText;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private String serverUrl = "http://127.0.0.1:6299";

    private static final int DEFAULT_PORT = 6299;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        statusText = findViewById(R.id.statusText);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                statusText.setText("Loading …");
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                statusText.setText("");
            }
        });

        startServerWatcher();
    }

    private void startServerWatcher() {
        handler.post(new Runnable() {
            @Override
            public void run() {
                int port = detectServer();
                if (port > 0) {
                    serverUrl = "http://127.0.0.1:" + port;
                    statusText.setText("Connected to local server on port " + port);
                    webView.loadUrl(serverUrl);
                } else {
                    statusText.setText(
                            "Local Misci server not detected.\n\n" +
                                    "Open Termux and run:\n" +
                                    "  misci\n"
                    );
                    webView.loadDataWithBaseURL(
                            null,
                            buildHelpHtml(),
                            "text/html",
                            "utf-8",
                            null
                    );
                }
                handler.postDelayed(this, 5000);
            }
        });
    }

    private int detectServer() {
        String[] ports = {String.valueOf(DEFAULT_PORT), "3000", "8080"};
        for (String p : ports) {
            int port = Integer.parseInt(p);
            if (isPortOpen(port)) return port;
        }
        return -1;
    }

    private boolean isPortOpen(int port) {
        try {
            Socket socket = new Socket();
            socket.connect(new InetSocketAddress("127.0.0.1", port), 500);
            socket.close();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private String buildHelpHtml() {
        return "<html><body style='background:#111;color:#eee;font-family:sans-serif;padding:24px'>" +
                "<h2>Misci server not found</h2>" +
                "<p>Install Termux, then run the one-line setup:</p>" +
                "<pre style='background:#222;padding:12px;border-radius:8px;white-space:pre-wrap'>" +
                "curl -fsSL https://misci.sh/install | bash && misci</pre>" +
                "<p>The server will start on port 6299. This app connects automatically.</p>" +
                "</body></html>";
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
