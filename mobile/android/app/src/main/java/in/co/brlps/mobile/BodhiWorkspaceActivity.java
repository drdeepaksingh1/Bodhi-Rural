package in.co.brlps.mobile;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;
import android.window.OnBackInvokedDispatcher;

public final class BodhiWorkspaceActivity extends Activity {
    static final String PAGE_URL = "pageUrl";
    static final String HINDI = "hindi";
    private static final int PICK_FILE = 401;
    private static final int SHOP_LOCATION = 402;
    private WebView workspace;
    private ValueCallback<Uri[]> fileSelection;
    private GeolocationPermissions.Callback locationCallback;
    private String locationOrigin;
    private boolean hindi;

    @Override
    protected void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        hindi = getIntent().getBooleanExtra(HINDI, false);
        Uri initial = Uri.parse(getIntent().getStringExtra(PAGE_URL) == null
            ? "" : getIntent().getStringExtra(PAGE_URL));
        if (!isBodhiSite(initial)) {
            finish();
            return;
        }

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setOnApplyWindowInsetsListener((view, insets) -> {
            layout.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        Button back = new Button(this);
        back.setText(hindi ? "वापस" : "Back");
        back.setAllCaps(false);
        back.setBackgroundColor(Color.rgb(18, 69, 49));
        back.setTextColor(Color.WHITE);
        back.setOnClickListener(view -> goBack());
        layout.addView(back);

        ProgressBar progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        layout.addView(progress, new LinearLayout.LayoutParams(-1, 6));
        workspace = new WebView(this);
        layout.addView(workspace, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(layout);

        WebSettings settings = workspace.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        CookieManager.getInstance().setAcceptThirdPartyCookies(workspace, false);

        workspace.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                if (isBodhiSite(target)) return false;
                if (request.isForMainFrame() && request.hasGesture() && "mailto".equals(target.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_SENDTO, target));
                    } catch (ActivityNotFoundException failure) {
                        Toast.makeText(BodhiWorkspaceActivity.this,
                            hindi ? "ईमेल ऐप उपलब्ध नहीं है।" : "No email app is available.", Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
        });
        workspace.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value >= 100 ? android.view.View.GONE : android.view.View.VISIBLE);
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                Uri current = Uri.parse(workspace.getUrl() == null ? "" : workspace.getUrl());
                if (!isBodhiSite(Uri.parse(origin)) || !isBodhiSite(current)
                    || !"/bodhimart/seller/register".equals(current.getPath()) || locationCallback != null) {
                    callback.invoke(origin, false, false);
                    return;
                }
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }
                locationOrigin = origin;
                locationCallback = callback;
                requestPermissions(new String[] {Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION}, SHOP_LOCATION);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileSelection != null) return false;
                fileSelection = callback;
                try {
                    startActivityForResult(params.createIntent(), PICK_FILE);
                    return true;
                } catch (ActivityNotFoundException failure) {
                    fileSelection = null;
                    return false;
                }
            }
        });

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBack);
        }
        if (savedState == null || workspace.restoreState(savedState) == null) {
            workspace.loadUrl(initial.toString());
        }
    }

    static boolean isBodhiSite(Uri uri) {
        return "https".equals(uri.getScheme())
            && ("www.brlps.co.in".equalsIgnoreCase(uri.getHost()) || "brlps.co.in".equalsIgnoreCase(uri.getHost()))
            && uri.getUserInfo() == null && (uri.getPort() == -1 || uri.getPort() == 443);
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void goBack() {
        if (workspace.canGoBack()) workspace.goBack();
        else finish();
    }

    @Override
    public void onBackPressed() {
        goBack();
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        workspace.saveState(state);
        super.onSaveInstanceState(state);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == SHOP_LOCATION && locationCallback != null) {
            Uri current = Uri.parse(workspace.getUrl() == null ? "" : workspace.getUrl());
            locationCallback.invoke(locationOrigin, hasLocationPermission()
                && isBodhiSite(current) && "/bodhimart/seller/register".equals(current.getPath()), false);
            locationCallback = null;
            locationOrigin = null;
        }
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILE && fileSelection != null) {
            ValueCallback<Uri[]> callback = fileSelection;
            fileSelection = null;
            Uri[] selected = WebChromeClient.FileChooserParams.parseResult(result, data);
            if (selected != null) {
                for (Uri uri : selected) {
                    if (uri == null || !"content".equals(uri.getScheme())) {
                        callback.onReceiveValue(null);
                        return;
                    }
                }
            }
            callback.onReceiveValue(selected);
        }
    }

    @Override
    protected void onDestroy() {
        if (fileSelection != null) fileSelection.onReceiveValue(null);
        if (locationCallback != null) locationCallback.invoke(locationOrigin, false, false);
        if (workspace != null) {
            ((LinearLayout) workspace.getParent()).removeView(workspace);
            workspace.destroy();
        }
        super.onDestroy();
    }
}
