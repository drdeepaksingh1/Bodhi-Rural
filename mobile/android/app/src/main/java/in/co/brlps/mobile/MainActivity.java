package in.co.brlps.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.io.IOException;
import java.io.InputStream;

public final class MainActivity extends Activity {
    private static final int GREEN = Color.rgb(18, 69, 49);
    private static final int CREAM = Color.rgb(249, 246, 237);
    private static final int ORANGE = Color.rgb(245, 178, 38);
    private static final String WEBSITE = "https://www.brlps.co.in";

    private enum Screen { HOME, FARM, MART }
    private Screen screen = Screen.HOME;
    private boolean hindi;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        hindi = getPreferences(MODE_PRIVATE).getBoolean("hindi", false);
        if (state != null) {
            String savedScreen = state.getString("screen");
            if (savedScreen != null) screen = Screen.valueOf(savedScreen);
        }
        render();
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        state.putString("screen", screen.name());
        super.onSaveInstanceState(state);
    }

    @Override
    public void onBackPressed() {
        if (screen == Screen.HOME) {
            super.onBackPressed();
        } else {
            show(Screen.HOME);
        }
    }

    private String text(String english, String translation) {
        return hindi ? translation : english;
    }

    private void show(Screen page) {
        screen = page;
        render();
    }

    private void render() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(CREAM);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);
        content.setPadding(dp(24), dp(28), dp(24), dp(28));
        content.setOnApplyWindowInsetsListener((view, insets) -> {
            content.setPadding(dp(24) + insets.getSystemWindowInsetLeft(),
                dp(28) + insets.getSystemWindowInsetTop(),
                dp(24) + insets.getSystemWindowInsetRight(),
                dp(28) + insets.getSystemWindowInsetBottom());
            return insets;
        });
        scroll.addView(content);
        setContentView(scroll);

        if (screen != Screen.HOME) {
            addButton(content, text("Back to Bodhi Rural", "बोधि रूरल पर लौटें"), false, () -> show(Screen.HOME));
        }
        addBrand(content);
        String title = screen == Screen.HOME ? "Bodhi Rural" : screen == Screen.FARM ? "BodhiFarm" : "BodhiMart";
        addHeading(content, title, 32);
        addButton(content, text("Language · English / हिन्दी", "भाषा · English / हिन्दी"), false, this::chooseLanguage);

        switch (screen) {
            case HOME:
                addButton(content, text("BodhiFarm\nFarm operations", "BodhiFarm\nफार्म संचालन"), true, () -> show(Screen.FARM));
                addButton(content, text("BodhiMart\nShop, sell or deliver", "BodhiMart\nखरीदें, बेचें या डिलीवरी करें"), true, () -> show(Screen.MART));
                break;
            case FARM:
                addHeading(content, text("Choose your sign-in", "लॉग इन का प्रकार चुनें"), 21);
                addButton(content, text("Farmer", "किसान"), true, () -> openFarmSignIn(text("Farmer", "किसान")));
                addButton(content, text("Field Team", "फील्ड टीम"), true, () -> openFarmSignIn(text("Field Team", "फील्ड टीम")));
                addButton(content, text("Management", "प्रबंधन"), true, () -> openFarmSignIn(text("Management", "प्रबंधन")));
                break;
            case MART:
                addHeading(content, text("Choose your sign-in", "लॉग इन का प्रकार चुनें"), 21);
                addButton(content, text("Buyer", "खरीदार"), true, () -> openMartSignIn("buyer", "/bodhimart/products"));
                addButton(content, text("Seller", "विक्रेता"), true, () -> openMartSignIn("seller", "/bodhimart/seller/dashboard"));
                addButton(content, text("Delivery Partner", "डिलीवरी पार्टनर"), true, this::showDeliveryStatus);
                addButton(content, text("Browse products", "उत्पाद देखें"), false, () -> openWebsite(Uri.parse(WEBSITE + "/bodhimart/products")));
                break;
        }
    }

    private void addBrand(LinearLayout content) {
        ImageView logo = new ImageView(this);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logo.setContentDescription("Bodhi Rural");
        try (InputStream asset = getAssets().open("bodhi-rural-logo.png")) {
            logo.setImageDrawable(Drawable.createFromStream(asset, null));
        } catch (IOException ignored) {
            return;
        }
        content.addView(logo, new LinearLayout.LayoutParams(dp(220), dp(82)));
    }

    private void chooseLanguage() {
        new AlertDialog.Builder(this)
            .setTitle(text("Language", "भाषा"))
            .setSingleChoiceItems(new String[] {"English", "हिन्दी"}, hindi ? 1 : 0, (dialog, selection) -> {
                hindi = selection == 1;
                getPreferences(MODE_PRIVATE).edit().putBoolean("hindi", hindi).apply();
                dialog.dismiss();
                render();
            }).show();
    }

    private void openFarmSignIn(String role) {
        new AlertDialog.Builder(this)
            .setTitle(role)
            .setMessage(text("Continue with your BodhiFarm account in the browser.", "ब्राउज़र में अपने BodhiFarm खाते से लॉग इन करें।"))
            .setNegativeButton(android.R.string.cancel, null)
            .setPositiveButton(text("Continue", "आगे बढ़ें"), (dialog, which) -> openWebsite(
                Uri.parse(WEBSITE + "/login").buildUpon().appendQueryParameter("redirect", "/bodhifarm").build()))
            .show();
    }

    private void openMartSignIn(String account, String destination) {
        openWebsite(Uri.parse(WEBSITE + "/login").buildUpon()
            .appendQueryParameter("account", account)
            .appendQueryParameter("redirect", destination).build());
    }

    private void showDeliveryStatus() {
        new AlertDialog.Builder(this)
            .setTitle(text("Delivery Partner", "डिलीवरी पार्टनर"))
            .setMessage(text("Delivery partner sign-in is in development.", "डिलीवरी पार्टनर लॉग इन अभी तैयार किया जा रहा है।"))
            .setPositiveButton(android.R.string.ok, null)
            .show();
    }

    private void openWebsite(Uri destination) {
        try {
            Uri localizedDestination = destination.buildUpon()
                .appendQueryParameter("app_lang", hindi ? "hi" : "en")
                .build();
            startActivity(new Intent(Intent.ACTION_VIEW, localizedDestination));
        } catch (ActivityNotFoundException failure) {
            Toast.makeText(this, text("A browser is required to continue.", "आगे बढ़ने के लिए ब्राउज़र चाहिए।"), Toast.LENGTH_LONG).show();
        }
    }

    private void addHeading(LinearLayout group, String label, int size) {
        TextView heading = new TextView(this);
        heading.setText(label);
        heading.setTextSize(size);
        heading.setGravity(Gravity.CENTER);
        heading.setTextColor(GREEN);
        heading.setTypeface(null, Typeface.BOLD);
        heading.setPadding(0, dp(12), 0, dp(10));
        heading.setAccessibilityHeading(true);
        group.addView(heading);
    }

    private void addButton(LinearLayout group, String label, boolean primary, Runnable action) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextSize(primary ? 19 : 15);
        button.setTypeface(null, Typeface.BOLD);
        button.setTextColor(primary ? Color.WHITE : GREEN);
        button.setMinHeight(dp(primary ? 76 : 48));
        button.setPadding(dp(16), dp(10), dp(16), dp(10));
        GradientDrawable background = new GradientDrawable();
        background.setColor(primary ? GREEN : Color.WHITE);
        background.setCornerRadius(dp(17));
        background.setStroke(dp(1), primary ? GREEN : ORANGE);
        button.setBackground(background);
        button.setFocusable(true);
        button.setOnClickListener(view -> action.run());
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.topMargin = dp(12);
        group.addView(button, params);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
