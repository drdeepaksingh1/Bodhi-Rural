package in.co.brlps.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.net.ssl.HttpsURLConnection;

public final class BodhiMartShopActivity extends Activity {
    private static final String API = "https://ddsvokqqwkkjlzcuoimi.supabase.co/rest/v1/";
    private static final String PUBLIC_KEY = "sb_publishable_qPTvI1sppJDpmoDBUrPveA_wpKHrO90";
    private static final int GREEN = 0xff124531;
    private static final int CREAM = 0xfffaf7ee;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final List<JSONObject> listings = new ArrayList<>();
    private final List<JSONObject> visible = new ArrayList<>();
    private final Map<String, JSONObject> categories = new HashMap<>();
    private final NumberFormat money = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
    private String selected = "";
    private boolean hindi;
    private boolean loaded;
    private TextView status;
    private Button retry;
    private EditText search;
    private LinearLayout categoryRow;
    private BaseAdapter adapter;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        hindi = getIntent().getBooleanExtra(BodhiWorkspaceActivity.HINDI, false);
        LinearLayout root = column();
        root.setBackgroundColor(GREEN);
        root.setFocusableInTouchMode(true);
        getWindow().getDecorView().setSystemUiVisibility(0);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            root.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        LinearLayout header = column();
        header.setBackgroundColor(GREEN);
        header.setPadding(dp(16), dp(12), dp(16), dp(12));
        LinearLayout brand = new LinearLayout(this);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.bodhi_logo);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logo.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        LinearLayout.LayoutParams logoLayout = new LinearLayout.LayoutParams(dp(34), dp(34));
        logoLayout.setMarginEnd(dp(8));
        brand.addView(logo, logoLayout);
        TextView title = label("BodhiMart", 27);
        title.setTextColor(Color.WHITE);
        title.setTypeface(null, Typeface.BOLD);
        title.setAccessibilityHeading(true);
        brand.addView(title);
        header.addView(brand);

        TextView headline = label(text("Shop for home, school and farm", "घर, स्कूल और खेत के लिए खरीदारी"), 23);
        headline.setTextColor(Color.WHITE);
        headline.setTypeface(null, Typeface.BOLD);
        headline.setPadding(0, dp(12), 0, 0);
        header.addView(headline);

        search = new EditText(this);
        search.setSingleLine(true);
        search.setTextColor(GREEN);
        search.setHintTextColor(0xff546b60);
        search.setBackground(surface(Color.WHITE, 14));
        search.setPadding(dp(14), dp(10), dp(14), dp(10));
        search.setHint(text("Search rice, seeds, notebooks…", "चावल, बीज, कॉपी खोजें…"));
        search.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        LinearLayout.LayoutParams searchLayout = new LinearLayout.LayoutParams(-1, dp(48));
        searchLayout.topMargin = dp(12);
        header.addView(search, searchLayout);
        Button address = button(text("Delivery address  ›", "डिलीवरी का पता  ›"),
            () -> openPage("/bodhimart/addresses"));
        address.setTextColor(Color.WHITE);
        address.setBackground(surface(0xff245743, 12));
        address.setElevation(0);
        LinearLayout.LayoutParams addressLayout = new LinearLayout.LayoutParams(-2, dp(44));
        addressLayout.topMargin = dp(8);
        header.addView(address, addressLayout);
        LinearLayout storefront = column();
        storefront.addView(header);

        LinearLayout catalog = column();
        catalog.setBackgroundColor(CREAM);
        storefront.addView(catalog);
        TextView browse = label(text("Shop by category", "श्रेणी से खरीदें"), 17);
        browse.setTypeface(null, Typeface.BOLD);
        browse.setAccessibilityHeading(true);
        browse.setPadding(dp(16), dp(14), dp(16), dp(6));
        catalog.addView(browse);

        HorizontalScrollView categoryStrip = new HorizontalScrollView(this);
        categoryStrip.setHorizontalScrollBarEnabled(false);
        categoryRow = new LinearLayout(this);
        categoryRow.setPadding(dp(12), dp(2), dp(12), dp(8));
        categoryStrip.addView(categoryRow);
        catalog.addView(categoryStrip);

        TextView productsHeading = label(text("Browse products", "उत्पाद देखें"), 19);
        productsHeading.setTypeface(null, Typeface.BOLD);
        productsHeading.setAccessibilityHeading(true);
        productsHeading.setPadding(dp(16), dp(8), dp(16), 0);
        catalog.addView(productsHeading);
        status = label("", 15);
        status.setPadding(dp(16), dp(6), dp(16), dp(6));
        status.setTypeface(null, Typeface.BOLD);
        catalog.addView(status);
        retry = button(text("Try again", "फिर कोशिश करें"), this::load);
        retry.setVisibility(View.GONE);
        catalog.addView(retry);

        ListView list = new ListView(this);
        list.setDivider(new android.graphics.drawable.ColorDrawable(CREAM));
        list.setDividerHeight(dp(8));
        list.setClipToPadding(false);
        list.setBackgroundColor(CREAM);
        list.setPadding(0, 0, 0, dp(8));
        list.setItemsCanFocus(true);
        list.addHeaderView(storefront, null, false);
        adapter = new BaseAdapter() {
            @Override public int getCount() { return visible.size(); }
            @Override public JSONObject getItem(int position) { return visible.get(position); }
            @Override public long getItemId(int position) { return position; }
            @Override public View getView(int position, View convertView, ViewGroup parent) {
                LinearLayout row = convertView == null ? productCard() : (LinearLayout) convertView;
                JSONObject item = getItem(position);
                LinearLayout card = (LinearLayout) row.getChildAt(0);
                ((TextView) card.getChildAt(0)).setText(item.optString("name"));
                ((TextView) card.getChildAt(1)).setText(price(item));
                return row;
            }
        };
        list.setAdapter(adapter);
        list.setOnItemClickListener((parent, item, index, id) -> {
            Object product = parent.getItemAtPosition(index);
            if (product instanceof JSONObject) showProduct((JSONObject) product);
        });
        root.addView(list, new LinearLayout.LayoutParams(-1, 0, 1));

        LinearLayout nav = new LinearLayout(this);
        addTab(nav, text("Shop", "खरीदारी"), true, () -> {
            selected = "";
            search.setText("");
            renderCategories();
            filter();
            list.setSelection(0);
        });
        addTab(nav, text("Categories", "श्रेणियाँ"), false, this::showCategories);
        addTab(nav, text("Account", "खाता"), false, this::showAccount);
        addTab(nav, text("Cart", "टोकरी"), false, () -> openPage("/bodhimart/cart"));
        nav.setBackgroundColor(Color.WHITE);
        nav.setPadding(dp(4), dp(4), dp(4), dp(4));
        root.addView(nav);
        setContentView(root);
        root.requestFocus();
        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { filter(); }
            @Override public void afterTextChanged(Editable s) {}
        });
        load();
    }

    private void load() {
        retry.setVisibility(View.GONE);
        status.setText(text("Loading products…", "उत्पाद लोड हो रहे हैं…"));
        io.execute(() -> {
            try {
                JSONArray departments = request("marketplace_categories?select=id,name,parent_id&is_active=eq.true&order=name.asc");
                JSONArray products = request("marketplace_public_products?select=product_id,name,unit,selling_price,category_id,description&status=eq.ACTIVE&order=created_at.desc,id.desc&limit=100");
                runOnUiThread(() -> {
                    if (isDestroyed() || isFinishing()) return;
                    categories.clear();
                    listings.clear();
                    for (int i = 0; i < departments.length(); i++) {
                        JSONObject item = departments.optJSONObject(i);
                        if (item != null) categories.put(item.optString("id"), item);
                    }
                    for (int i = 0; i < products.length(); i++) {
                        JSONObject item = products.optJSONObject(i);
                        if (item != null) listings.add(item);
                    }
                    loaded = true;
                    renderCategories();
                    filter();
                });
            } catch (Exception ignored) {
                runOnUiThread(() -> {
                    if (isDestroyed() || isFinishing()) return;
                    status.setText(text("Could not load the catalogue. Check your connection.", "कैटलॉग नहीं खुला। अपना कनेक्शन जाँचें।"));
                    retry.setVisibility(View.VISIBLE);
                });
            }
        });
    }

    private static JSONArray request(String path) throws Exception {
        HttpsURLConnection connection = (HttpsURLConnection) new URL(API + path).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(8000);
        connection.setRequestProperty("apikey", PUBLIC_KEY);
        try {
            if (connection.getResponseCode() != 200) throw new IllegalStateException("Catalogue unavailable");
            try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[4096];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 2_000_000) throw new IllegalStateException("Catalogue response too large");
                    output.write(buffer, 0, count);
                }
                return new JSONArray(output.toString(StandardCharsets.UTF_8.name()));
            }
        } finally { connection.disconnect(); }
    }

    private List<JSONObject> children(String parent) {
        List<JSONObject> result = new ArrayList<>();
        for (JSONObject category : categories.values()) {
            if (parent.equals(field(category, "parent_id"))) result.add(category);
        }
        result.sort((a, b) -> a.optString("name").compareToIgnoreCase(b.optString("name")));
        return result;
    }

    private void renderCategories() {
        categoryRow.removeAllViews();
        addCategoryButton(text("All", "सभी"), "");
        for (JSONObject category : children("")) addCategoryButton(category.optString("name"), category.optString("id"));
    }

    private void addCategoryButton(String name, String id) {
        Button chip = button(name, () -> selectCategory(id));
        boolean active = id.equals(selected);
        chip.setSelected(active);
        chip.setTextColor(active ? Color.WHITE : GREEN);
        chip.setBackground(surface(active ? GREEN : 0xffe7eee4, 22));
        chip.setElevation(0);
        chip.setMinWidth(0);
        chip.setPadding(dp(14), 0, dp(14), 0);
        LinearLayout.LayoutParams layout = new LinearLayout.LayoutParams(-2, dp(44));
        layout.setMarginEnd(dp(8));
        categoryRow.addView(chip, layout);
    }

    private void showCategories() {
        if (!loaded) return;
        showCategoryOptions("", text("All categories", "सभी श्रेणियाँ"));
    }

    private void showCategoryOptions(String parent, String title) {
        List<JSONObject> options = children(parent);
        String[] names = new String[options.size() + 1];
        names[0] = text("View all products here", "यहाँ सभी उत्पाद देखें");
        for (int i = 0; i < options.size(); i++) names[i + 1] = options.get(i).optString("name");
        new AlertDialog.Builder(this).setTitle(title).setItems(names, (dialog, index) -> {
            if (index == 0) { selectCategory(parent); return; }
            JSONObject item = options.get(index - 1);
            String id = item.optString("id");
            if (children(id).isEmpty()) selectCategory(id);
            else showCategoryOptions(id, item.optString("name"));
        }).show();
    }

    private void selectCategory(String id) {
        selected = id;
        renderCategories();
        filter();
    }

    private boolean matchesCategory(String id) {
        if (selected.isEmpty()) return true;
        for (int depth = 0; depth < 12 && !id.isEmpty(); depth++) {
            if (selected.equals(id)) return true;
            JSONObject category = categories.get(id);
            id = category == null ? "" : field(category, "parent_id");
        }
        return false;
    }

    private void filter() {
        if (!loaded) return;
        String query = search.getText().toString().trim().toLowerCase(Locale.ROOT);
        visible.clear();
        for (JSONObject item : listings) {
            if (matchesCategory(item.optString("category_id", ""))
                && item.optString("name").toLowerCase(Locale.ROOT).contains(query)) visible.add(item);
        }
        adapter.notifyDataSetChanged();
        JSONObject category = categories.get(selected);
        String section = category == null ? "" : category.optString("name") + " · ";
        status.setText(section + (visible.isEmpty() ? text("No matching products", "कोई उत्पाद नहीं मिला")
            : visible.size() + text(visible.size() == 1 ? " product" : " products", " उत्पाद")));
    }

    private static String field(JSONObject item, String key) {
        return item.isNull(key) ? "" : item.optString(key, "");
    }

    private String price(JSONObject item) {
        String unit = field(item, "unit");
        return money.format(item.optDouble("selling_price", 0)) + (unit.isEmpty() ? "" : " / " + unit);
    }

    private void showProduct(JSONObject item) {
        String code = android.net.Uri.encode(item.optString("product_id"));
        String description = field(item, "description");
        new AlertDialog.Builder(this).setTitle(item.optString("name"))
            .setMessage(price(item) + (description.isEmpty() ? "" : "\n\n" + description))
            .setNegativeButton(android.R.string.cancel, null)
            .setPositiveButton(text("View buying options", "खरीदने के विकल्प"), (dialog, which) -> openPage("/bodhimart/products/" + code))
            .show();
    }

    private void showAccount() {
        String[] options = {
            text("My buyer account", "मेरा खरीदार खाता"),
            text("Seller sign-in", "विक्रेता लॉग इन"),
            text("Register as a seller", "विक्रेता के रूप में आवेदन"),
            text("Delivery partner sign-in", "डिलीवरी पार्टनर लॉग इन"),
            text("Apply as a delivery partner", "डिलीवरी पार्टनर के लिए आवेदन"),
            text("Privacy and account deletion", "गोपनीयता और खाता हटाना")
        };
        String[] paths = {
            "/bodhimart/account",
            "/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fdashboard",
            "/bodhimart/seller/register",
            "/login?redirect=%2Fbodhimart%2Fdelivery",
            "/bodhimart/delivery/register",
            "/privacy-policy/bodhimart"
        };
        new AlertDialog.Builder(this).setTitle(text("Account", "खाता"))
            .setItems(options, (dialog, index) -> openPage(paths[index])).show();
    }

    private GradientDrawable surface(int color, int radius) {
        GradientDrawable background = new GradientDrawable();
        background.setColor(color);
        background.setCornerRadius(dp(radius));
        return background;
    }

    private void openPage(String path) {
        startActivity(new Intent(this, BodhiWorkspaceActivity.class)
            .putExtra(BodhiWorkspaceActivity.PAGE_URL, "https://www.brlps.co.in" + path + (path.contains("?") ? "&app_lang=" : "?app_lang=") + (hindi ? "hi" : "en"))
            .putExtra(BodhiWorkspaceActivity.HINDI, hindi));
    }

    private LinearLayout column() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        return layout;
    }

    private TextView label(String value, int size) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(GREEN);
        return view;
    }

    private LinearLayout productCard() {
        LinearLayout row = column();
        row.setPadding(dp(12), 0, dp(12), 0);
        LinearLayout card = column();
        card.setPadding(dp(16), dp(13), dp(16), dp(13));
        card.setBackground(surface(Color.WHITE, 16));
        row.addView(card, new LinearLayout.LayoutParams(-1, -2));
        TextView name = label("", 16);
        name.setTypeface(null, Typeface.BOLD);
        card.addView(name);
        TextView amount = label("", 15);
        card.addView(amount);
        return row;
    }

    private void addTab(LinearLayout nav, String value, boolean active, Runnable action) {
        Button tab = button(value, action);
        tab.setBackground(surface(active ? 0xffe1eee0 : Color.WHITE, 12));
        tab.setSelected(active);
        tab.setElevation(0);
        tab.setTextColor(GREEN);
        tab.setTextSize(12);
        tab.setMinWidth(0);
        tab.setPadding(dp(2), 0, dp(2), 0);
        LinearLayout.LayoutParams tabLayout = new LinearLayout.LayoutParams(0, dp(50), 1);
        tabLayout.setMargins(dp(2), 0, dp(2), 0);
        nav.addView(tab, tabLayout);
    }

    private Button button(String value, Runnable action) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setGravity(Gravity.CENTER);
        button.setText(value);
        button.setOnClickListener(view -> action.run());
        return button;
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private String text(String en, String hi) { return hindi ? hi : en; }

    @Override protected void onDestroy() {
        io.shutdownNow();
        super.onDestroy();
    }
}
