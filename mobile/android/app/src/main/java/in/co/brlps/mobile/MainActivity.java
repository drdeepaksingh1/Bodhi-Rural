package in.co.brlps.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.FrameLayout;

import java.util.EnumSet;

public final class MainActivity extends Activity {
    private static final int GREEN = Color.rgb(18, 69, 49);
    private static final int CREAM = Color.rgb(249, 246, 237);
    private static final int ORANGE = Color.rgb(245, 178, 38);
    private static final String WEBSITE = "https://www.brlps.co.in";

    private enum Screen { HOME, FARM, MART, FARMER, FIELD_TEAM, MANAGEMENT, BUYER, SELLER, DELIVERY }
    private Screen screen = Screen.HOME;
    private boolean hindi;
    private OnBackInvokedCallback backCallback;
    private final EnumSet<Screen> shownIntros = EnumSet.noneOf(Screen.class);
    private View introView;

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
            show(parentScreen());
        }
    }

    private String text(String english, String translation) {
        return hindi ? translation : english;
    }

    private void show(Screen page) {
        screen = page;
        render();
    }

    private void updateBackCallback() {
        if (Build.VERSION.SDK_INT < 33) return;
        if (screen == Screen.HOME) {
            if (backCallback != null) {
                getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCallback);
                backCallback = null;
            }
        } else if (backCallback == null) {
            backCallback = () -> show(parentScreen());
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (introView != null) render();
    }

    private void openModule(Screen module) {
        if (!shownIntros.add(module)) {
            show(module);
            return;
        }
        screen = module;
        updateBackCallback();

        boolean farm = module == Screen.FARM;
        FrameLayout cover = new FrameLayout(this);
        cover.setBackground(new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            farm ? new int[] {0xff0d3425, 0xff246746} : new int[] {0xff073b2c, 0xff146040}));
        cover.setOnApplyWindowInsetsListener((view, insets) -> {
            cover.setPadding(dp(24) + insets.getSystemWindowInsetLeft(),
                dp(24) + insets.getSystemWindowInsetTop(),
                dp(24) + insets.getSystemWindowInsetRight(),
                dp(24) + insets.getSystemWindowInsetBottom());
            return insets;
        });

        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.VERTICAL);
        brand.setGravity(Gravity.CENTER);
        cover.addView(brand, new FrameLayout.LayoutParams(-1, -2, Gravity.CENTER));

        ImageView mark = new ImageView(this);
        mark.setImageResource(R.drawable.bodhi_logo);
        mark.setScaleType(ImageView.ScaleType.FIT_CENTER);
        mark.setPadding(dp(14), dp(14), dp(14), dp(14));
        GradientDrawable tile = new GradientDrawable();
        tile.setColor(Color.WHITE);
        tile.setCornerRadius(dp(28));
        mark.setBackground(tile);
        brand.addView(mark, new LinearLayout.LayoutParams(dp(110), dp(110)));

        TextView title = new TextView(this);
        title.setText(farm ? "BodhiFarm" : "BodhiMart");
        title.setTextSize(42);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(Color.WHITE);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(24), 0, dp(8));
        brand.addView(title);

        View accent = new View(this);
        accent.setBackgroundColor(ORANGE);
        brand.addView(accent, new LinearLayout.LayoutParams(dp(46), dp(3)));

        TextView subtitle = new TextView(this);
        subtitle.setText(farm
            ? text("Farm operations and training", "फार्म संचालन और प्रशिक्षण")
            : text("Shop, sell and deliver", "खरीदें, बेचें और डिलीवरी करें"));
        subtitle.setTextSize(16);
        subtitle.setTextColor(0xffe5f2e9);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, dp(15), 0, 0);
        brand.addView(subtitle);

        Button skip = new Button(this);
        skip.setText(text("Continue", "आगे बढ़ें"));
        skip.setAllCaps(false);
        skip.setOnClickListener(view -> render());
        cover.addView(skip, new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL));

        introView = cover;
        setContentView(cover);
        brand.setAlpha(0f);
        brand.animate().alpha(1f).setDuration(300).start();
        cover.postDelayed(() -> {
            if (introView == cover) render();
        }, 1150);
    }

    private void render() {
        introView = null;
        updateBackCallback();
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
            addButton(content, text("Back", "वापस"), false, () -> show(parentScreen()));
        }
        addBrand(content);
        String title = screen == Screen.HOME ? "Bodhi Rural" : isFarmScreen() ? "BodhiFarm" : "BodhiMart";
        addHeading(content, title, 32);
        addButton(content, text("Language · English / हिन्दी", "भाषा · English / हिन्दी"), false, this::chooseLanguage);

        switch (screen) {
            case HOME:
                addButton(content, text("BodhiFarm\nFarm operations", "BodhiFarm\nफार्म संचालन"), true, () -> openModule(Screen.FARM));
                addButton(content, text("BodhiMart\nShop, sell or deliver", "BodhiMart\nखरीदें, बेचें या डिलीवरी करें"), true, () -> openModule(Screen.MART));
                break;
            case FARM:
                addButton(content, text("Skills & Training", "कौशल और प्रशिक्षण"), true,
                    () -> openPage("/skills-training"));
                addHeading(content, text("Choose your sign-in", "लॉग इन का प्रकार चुनें"), 21);
                addButton(content, text("Farmer", "किसान"), true, () -> show(Screen.FARMER));
                addButton(content, text("Field Team", "फील्ड टीम"), true, () -> show(Screen.FIELD_TEAM));
                addButton(content, text("Management", "प्रबंधन"), true, () -> show(Screen.MANAGEMENT));
                break;
            case MART:
                addButton(content, text("Browse products without signing in", "बिना लॉग इन के उत्पाद देखें"), true,
                    () -> openPage("/bodhimart/products"));
                addHeading(content, text("Choose your sign-in", "लॉग इन का प्रकार चुनें"), 21);
                addButton(content, text("Buyer", "खरीदार"), false, () -> show(Screen.BUYER));
                addButton(content, text("Seller", "विक्रेता"), false, () -> show(Screen.SELLER));
                addButton(content, text("Delivery Partner", "डिलीवरी पार्टनर"), false, () -> show(Screen.DELIVERY));
                break;
            case FARMER:
                addHeading(content, text("Farmer", "किसान"), 24);
                addSignIn(content, () -> openWebsiteSignIn("/bodhifarm"));
                addButton(content, text("Apply as a farmer", "किसान के रूप में आवेदन करें"), false,
                    () -> openPage("/farmer/register"));
                break;
            case FIELD_TEAM:
                addHeading(content, text("Field Team", "फील्ड टीम"), 24);
                addSignIn(content, () -> openWebsiteSignIn("/bodhifarm"));
                break;
            case MANAGEMENT:
                addHeading(content, text("Management", "प्रबंधन"), 24);
                addSignIn(content, () -> openWebsiteSignIn("/dashboard"));
                break;
            case BUYER:
                addHeading(content, text("Buyer", "खरीदार"), 24);
                addSignIn(content, () -> openMartSignIn("buyer", "/bodhimart/products"));
                addButton(content, text("Create a buyer account", "खरीदार खाता बनाएँ"), false,
                    () -> openPage("/bodhimart/register"));
                addButton(content, text("Browse products", "उत्पाद देखें"), false,
                    () -> openPage("/bodhimart/products"));
                break;
            case SELLER:
                addHeading(content, text("Seller", "विक्रेता"), 24);
                addSignIn(content, () -> openMartSignIn("seller", "/bodhimart/seller/dashboard"));
                addButton(content, text("Apply to sell", "विक्रेता बनने के लिए आवेदन करें"), false,
                    () -> openPage("/bodhimart/seller/register"));
                addButton(content, text("Check application status", "आवेदन की स्थिति देखें"), false,
                    () -> openPage("/bodhimart/seller/status"));
                break;
            case DELIVERY:
                addHeading(content, text("Delivery Partner", "डिलीवरी पार्टनर"), 24);
                addSignIn(content, () -> openWebsiteSignIn("/bodhimart/delivery"));
                break;
        }
        if (screen != Screen.HOME && screen != Screen.FARM && screen != Screen.MART) {
            addButton(content, text("Privacy policy", "गोपनीयता नीति"), false, () -> openPage("/privacy-policy"));
            addButton(content, text("Request account deletion", "खाता हटाने का अनुरोध करें"), false,
                () -> openPage("/account-deletion"));
        }
    }

    private void addBrand(LinearLayout content) {
        ImageView logo = new ImageView(this);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logo.setContentDescription("Bodhi Rural");
        logo.setImageResource(R.drawable.bodhi_logo);
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

    private Screen parentScreen() {
        switch (screen) {
            case FARMER:
            case FIELD_TEAM:
            case MANAGEMENT:
                return Screen.FARM;
            case BUYER:
            case SELLER:
            case DELIVERY:
                return Screen.MART;
            default:
                return Screen.HOME;
        }
    }

    private boolean isFarmScreen() {
        return screen == Screen.FARM || parentScreen() == Screen.FARM;
    }

    private void addSignIn(LinearLayout content, Runnable action) {
        addButton(content, text("Sign in on Bodhi Rural", "बोधि रूरल पर लॉग इन करें"), true, action);
    }

    private void openWebsiteSignIn(String destination) {
        openWebsite(Uri.parse(WEBSITE + "/login").buildUpon()
            .appendQueryParameter("redirect", destination).build());
    }

    private void openPage(String path) {
        openWebsite(Uri.parse(WEBSITE + path));
    }

    private void openMartSignIn(String account, String destination) {
        openWebsite(Uri.parse(WEBSITE + "/login").buildUpon()
            .appendQueryParameter("account", account)
            .appendQueryParameter("redirect", destination).build());
    }

    private void openWebsite(Uri destination) {
        Uri localizedDestination = destination.buildUpon()
            .appendQueryParameter("app_lang", hindi ? "hi" : "en")
            .build();
        startActivity(new Intent(this, BodhiWorkspaceActivity.class)
            .putExtra(BodhiWorkspaceActivity.PAGE_URL, localizedDestination.toString())
            .putExtra(BodhiWorkspaceActivity.HINDI, hindi));
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
