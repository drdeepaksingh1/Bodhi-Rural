package in.co.brlps.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
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
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ScrollView;
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
    private final android.util.LruCache<String, Bitmap> productPhotos =
        new android.util.LruCache<String, Bitmap>(12 * 1024 * 1024) {
            @Override protected int sizeOf(String key, Bitmap value) { return value.getByteCount(); }
        };
    private final Map<String, Double> stock = new HashMap<>();
    private final List<JSONObject> listings = new ArrayList<>();
    private final List<JSONObject> visible = new ArrayList<>();
    private final Map<String, JSONObject> categories = new HashMap<>();
    private final NumberFormat money = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
    private String selected = "";
    private int sort = 0;
    private boolean hindi;
    private boolean loaded;
    private TextView status;
    private Button retry;
    private EditText search;
    private LinearLayout categoryGrid;
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

        TextView headline = label(text("Home, school & farm", "घर, स्कूल और खेत"), 20);
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

        categoryGrid = column();
        categoryGrid.setPadding(dp(12), 0, dp(12), dp(4));
        catalog.addView(categoryGrid);

        Button productsHeading = button(text("Browse products  ›", "उत्पाद देखें  ›"), this::openCatalogue);
        productsHeading.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        productsHeading.setBackground(surface(CREAM, 0));
        productsHeading.setStateListAnimator(null);
        productsHeading.setTextColor(GREEN);
        productsHeading.setTextSize(19);
        productsHeading.setMinHeight(dp(48));
        productsHeading.setTypeface(null, Typeface.BOLD);
        productsHeading.setAccessibilityHeading(true);
        productsHeading.setPadding(dp(16), 0, dp(16), 0);
        LinearLayout productToolbar = new LinearLayout(this);
        productToolbar.setGravity(Gravity.CENTER_VERTICAL);
        productToolbar.addView(productsHeading, new LinearLayout.LayoutParams(0, dp(48), 1));
        Button sortButton = button(text("Sort", "क्रम"), () -> {
            String[] options = {
                text("Newest", "नवीनतम"),
                text("Price: low to high", "मूल्य: कम से ज़्यादा"),
                text("Price: high to low", "मूल्य: ज़्यादा से कम"),
                text("Product name", "उत्पाद का नाम")
            };
            new AlertDialog.Builder(this).setTitle(text("Sort products", "उत्पादों का क्रम"))
                .setSingleChoiceItems(options, sort, (dialog, choice) -> {
                    sort = choice;
                    filter();
                    dialog.dismiss();
                }).setNegativeButton(android.R.string.cancel, null).show();
        });
        sortButton.setTextColor(GREEN);
        sortButton.setBackground(surface(0xffe1eee0, 12));
        sortButton.setStateListAnimator(null);
        LinearLayout.LayoutParams sortLayout = new LinearLayout.LayoutParams(-2, dp(44));
        sortLayout.setMarginEnd(dp(12));
        productToolbar.addView(sortButton, sortLayout);
        catalog.addView(productToolbar);
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
                ProductCard card = convertView == null ? new ProductCard() : (ProductCard) convertView;
                card.bind(getItem(position));
                return card;
            }
        };
        list.setAdapter(adapter);
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
        addTab(nav, text("Account", "खाता"), false, () -> openPage("/bodhimart/account"));
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
                JSONArray departments = request("marketplace_categories?select=id,name,slug,parent_id&is_active=eq.true&order=name.asc");
                JSONArray products = request("marketplace_public_products?select=id,product_id,name,unit,selling_price,mrp,category_id,description,brand,image_url,minimum_order_quantity,delivery_available&status=eq.ACTIVE&order=created_at.desc,id.desc&limit=100");
                Map<String, Double> available = readStock(products);
                runOnUiThread(() -> {
                    if (isDestroyed() || isFinishing()) return;
                    categories.clear();
                    listings.clear();
                    stock.clear();
                    stock.putAll(available);
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

    private static final String[][] HOME_DEPARTMENTS = {
        {"groceries", "🛒", "Groceries", "किराना"},
        {"fresh-produce", "🥬", "Fresh produce", "फल व सब्ज़ियाँ"},
        {"seeds", "🌱", "Seeds & crops", "बीज व फसल"},
        {"hotels-restaurants", "🍽", "Restaurants", "रेस्तराँ"},
        {"poultry", "🐔", "Livestock", "पशुधन"},
        {"feed", "🌾", "Animal feed", "पशु आहार"},
        {"school-stationery", "📚", "School supplies", "स्कूल सामग्री"},
        {"clothing-footwear", "👕", "Clothing", "कपड़े"},
        {"equipment", "🧰", "Farm tools", "कृषि उपकरण"},
        {"household-personal-care", "🧴", "Home & care", "घर व देखभाल"},
        {"hardware-electrical", "💡", "Hardware", "हार्डवेयर"},
        {"made-locally", "🧺", "Made locally", "स्थानीय उत्पाद"},
    };

    private void renderCategories() {
        categoryGrid.removeAllViews();
        Map<String, JSONObject> departments = new HashMap<>();
        for (JSONObject category : children("")) departments.put(category.optString("slug"), category);

        LinearLayout row = null;
        int column = 0;
        for (String[] tile : HOME_DEPARTMENTS) {
            JSONObject category = departments.get(tile[0]);
            if (category == null) continue;
            if (column == 0) {
                row = new LinearLayout(this);
                categoryGrid.addView(row);
            }
            String id = category.optString("id");
            String name = text(tile[2], tile[3]);
            Button button = button(tile[1] + "\n" + name, () -> {
                if (children(id).isEmpty()) selectCategory(id);
                else showCategoryOptions(id, name);
            });
            button.setContentDescription(name);
            boolean active = id.equals(selected);
            button.setSelected(active);
            button.setTextSize(11);
            button.setTextColor(active ? Color.WHITE : GREEN);
            button.setBackground(surface(active ? GREEN : Color.WHITE, 14));
            button.setStateListAnimator(null);
            button.setMinWidth(0);
            button.setPadding(dp(2), dp(3), dp(2), dp(3));
            button.setMinHeight(dp(52));
            LinearLayout.LayoutParams layout = new LinearLayout.LayoutParams(0, -2, 1);
            layout.setMargins(dp(3), dp(3), dp(3), dp(3));
            row.addView(button, layout);
            column = (column + 1) % 4;
        }
        if (row != null && column != 0) {
            for (int i = column; i < 4; i++) {
                row.addView(new View(this), new LinearLayout.LayoutParams(0, 0, 1));
            }
        }
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
        if (sort == 1) visible.sort((a, b) -> Double.compare(a.optDouble("selling_price"), b.optDouble("selling_price")));
        else if (sort == 2) visible.sort((a, b) -> Double.compare(b.optDouble("selling_price"), a.optDouble("selling_price")));
        else if (sort == 3) visible.sort((a, b) -> a.optString("name").compareToIgnoreCase(b.optString("name")));
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

    private void openCatalogue() {
        android.net.Uri.Builder route = new android.net.Uri.Builder().path("/bodhimart/products");
        JSONObject category = categories.get(selected);
        if (category != null) route.appendQueryParameter("category", selected);
        String query = search.getText().toString().trim();
        if (!query.isEmpty()) route.appendQueryParameter("search", query);
        openPage(route.build().toString());
    }

    private void showProduct(JSONObject item) {
        String code = field(item, "product_id");
        if (code.isEmpty()) return;

        Dialog details = new Dialog(this, android.R.style.Theme_Material_Light_NoActionBar);
        LinearLayout page = column();
        page.setBackgroundColor(CREAM);
        Button back = button(text("‹ Back to shop", "‹ दुकान पर लौटें"), details::dismiss);
        page.addView(back);

        ScrollView scroller = new ScrollView(this);
        page.addView(scroller, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout body = column();
        body.setPadding(dp(16), dp(8), dp(16), dp(24));
        scroller.addView(body);

        String name = item.optString("name");
        TextView title = label(name, 28);
        title.setTypeface(null, Typeface.BOLD);
        title.setAccessibilityHeading(true);
        body.addView(title);

        TextView amount = label(price(item), 21);
        amount.setTypeface(null, Typeface.BOLD);
        amount.setPadding(0, dp(6), 0, dp(12));
        body.addView(amount);

        ImageView photo = new ImageView(this);
        photo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        photo.setBackground(surface(Color.WHITE, 16));
        photo.setContentDescription(name);
        photo.setVisibility(View.GONE);
        body.addView(photo, new LinearLayout.LayoutParams(-1, dp(240)));

        String brand = field(item, "brand");
        if (!brand.isEmpty()) body.addView(label(text("Brand: ", "ब्रांड: ") + brand, 16));
        double minimum = item.optDouble("minimum_order_quantity", 0);
        if (minimum > 0) {
            NumberFormat quantity = NumberFormat.getNumberInstance();
            body.addView(label(text("Minimum order: ", "न्यूनतम ऑर्डर: ") + quantity.format(minimum)
                + " " + field(item, "unit"), 16));
        }
        String description = field(item, "description");
        if (!description.isEmpty()) {
            TextView about = label(text("About this product", "इस उत्पाद के बारे में"), 19);
            about.setTypeface(null, Typeface.BOLD);
            about.setAccessibilityHeading(true);
            about.setPadding(0, dp(16), 0, dp(6));
            body.addView(about);
            body.addView(label(description, 16));
        }

        Button buy = button(text("View buying options  ›", "खरीदने के विकल्प  ›"),
            () -> openPage("/bodhimart/products/" + android.net.Uri.encode(code)));
        buy.setTextColor(Color.WHITE);
        buy.setBackground(surface(GREEN, 14));
        LinearLayout.LayoutParams action = new LinearLayout.LayoutParams(-1, dp(52));
        action.setMargins(dp(16), dp(8), dp(16), dp(12));
        page.addView(buy, action);
        details.setContentView(page);
        details.show();
        if (details.getWindow() != null) details.getWindow().setLayout(-1, -1);

        String image = field(item, "image_url");
        if (!image.isEmpty()) io.execute(() -> {
            Bitmap bitmap = loadProductPhoto(image);
            if (bitmap != null) runOnUiThread(() -> {
                if (!details.isShowing() || isFinishing() || isDestroyed()) return;
                photo.setImageBitmap(bitmap);
                photo.setVisibility(View.VISIBLE);
            });
        });
    }

    private static Bitmap loadProductPhoto(String address) {
        HttpsURLConnection connection = null;
        try {
            URL url = new URL(address);
            if (!"https".equals(url.getProtocol()) || !"ddsvokqqwkkjlzcuoimi.supabase.co".equals(url.getHost())
                || (url.getPort() != -1 && url.getPort() != 443)
                || !url.getPath().startsWith("/storage/v1/object/public/bodhimart-product-images/")) return null;
            connection = (HttpsURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            if (connection.getResponseCode() != 200) return null;
            try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 5_000_000) return null;
                    output.write(buffer, 0, count);
                }
                byte[] image = output.toByteArray();
                BitmapFactory.Options options = new BitmapFactory.Options();
                options.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(image, 0, image.length, options);
                if (options.outWidth <= 0 || options.outHeight <= 0) return null;
                options.inSampleSize = 1;
                while (Math.max(options.outWidth, options.outHeight) / options.inSampleSize > 1024) {
                    options.inSampleSize *= 2;
                }
                options.inJustDecodeBounds = false;
                return BitmapFactory.decodeByteArray(image, 0, image.length, options);
            }
        } catch (Exception ignored) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private Map<String, Double> readStock(JSONArray products) {
        Map<String, Double> available = new HashMap<>();
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < products.length(); i++) {
            JSONObject item = products.optJSONObject(i);
            if (item != null && !field(item, "id").isEmpty()) ids.add(item.optString("id"));
        }
        if (ids.isEmpty()) return available;
        try {
            JSONArray rows = request("marketplace_public_inventory?select=product_id,available_quantity"
                + "&product_id=in.(" + android.net.Uri.encode(String.join(",", ids)) + ")");
            for (int i = 0; i < rows.length(); i++) {
                JSONObject row = rows.optJSONObject(i);
                if (row != null) available.put(row.optString("product_id"), row.optDouble("available_quantity", 0));
            }
        } catch (Exception ignored) {
            // Keep the product cards available when stock cannot be checked.
        }
        return available;
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

    private final class ProductCard extends LinearLayout {
        private final ImageView photo;
        private final TextView category, name, metadata, amount, savings, availability, code;
        private final Button details;

        ProductCard() {
            super(BodhiMartShopActivity.this);
            setOrientation(VERTICAL);
            setPadding(dp(12), 0, dp(12), 0);
            LinearLayout card = column();
            card.setPadding(dp(12), dp(8), dp(12), dp(8));
            card.setBackground(surface(Color.WHITE, 16));
            addView(card, new LinearLayout.LayoutParams(-1, -2));

            photo = new ImageView(BodhiMartShopActivity.this);
            photo.setScaleType(ImageView.ScaleType.FIT_CENTER);
            photo.setBackground(surface(CREAM, 12));
            card.addView(photo, new LinearLayout.LayoutParams(-1, dp(132)));
            category = line(card, 13, true);
            name = line(card, 21, true);
            metadata = line(card, 14, false);
            amount = line(card, 21, true);
            savings = line(card, 14, true);
            availability = line(card, 14, true);
            code = line(card, 12, false);
            details = button(text("View product details", "उत्पाद का विवरण देखें"), () -> {});
            details.setTextColor(Color.WHITE);
            details.setBackground(surface(GREEN, 12));
            details.setStateListAnimator(null);
            LayoutParams action = new LayoutParams(-1, dp(48));
            action.topMargin = dp(10);
            card.addView(details, action);
        }

        private TextView line(LinearLayout card, int size, boolean bold) {
            TextView view = label("", size);
            if (bold) view.setTypeface(null, Typeface.BOLD);
            view.setPadding(0, dp(6), 0, 0);
            card.addView(view);
            return view;
        }

        void bind(JSONObject item) {
            String title = item.optString("name");
            name.setText(title);
            JSONObject department = categories.get(field(item, "category_id"));
            String delivery = item.optBoolean("delivery_available") ? text("Delivery", "डिलीवरी") : "";
            String departmentName = department == null ? "" : department.optString("name");
            category.setText(departmentName.isEmpty() ? delivery
                : delivery.isEmpty() ? departmentName : departmentName + "  ·  " + delivery);
            String brand = field(item, "brand");
            String unit = field(item, "unit");
            metadata.setText((brand.isEmpty() ? "" : text("Brand: ", "ब्रांड: ") + brand + "\n")
                + (unit.isEmpty() ? "" : text("Unit: ", "इकाई: ") + unit));
            amount.setText(price(item));
            double sale = item.optDouble("selling_price", 0);
            double mrp = item.optDouble("mrp", 0);
            boolean discounted = sale > 0 && mrp > sale;
            savings.setVisibility(discounted ? View.VISIBLE : View.GONE);
            if (discounted) savings.setText(text("MRP ", "एमआरपी ") + money.format(mrp)
                + "  ·  " + text("Save ", "बचत ") + money.format(mrp - sale)
                + " (" + Math.round(100 * (mrp - sale) / mrp) + "%)");
            Double quantity = stock.get(field(item, "id"));
            availability.setText(quantity == null ? text("Check availability", "उपलब्धता जाँचें")
                : quantity > 0 ? text("In stock", "स्टॉक में") : text("Out of stock", "स्टॉक में नहीं"));
            code.setText(text("Product ID: ", "उत्पाद आईडी: ") + field(item, "product_id"));
            details.setOnClickListener(view -> showProduct(item));
            setOnClickListener(view -> showProduct(item));
            bindPhoto(photo, field(item, "image_url"), title);
        }
    }

    private void bindPhoto(ImageView view, String url, String name) {
        if (url.equals(view.getTag())) return;
        view.setTag(url);
        view.setContentDescription(name);
        view.setImageDrawable(null);
        Bitmap cached = productPhotos.get(url);
        view.setVisibility(cached == null ? View.GONE : View.VISIBLE);
        if (cached != null) {
            view.setImageBitmap(cached);
        } else if (!url.isEmpty()) {
            io.execute(() -> {
                Bitmap bitmap = productPhotos.get(url);
                if (bitmap == null) bitmap = loadProductPhoto(url);
                if (bitmap == null) return;
                productPhotos.put(url, bitmap);
                Bitmap result = bitmap;
                runOnUiThread(() -> {
                    if (isDestroyed() || isFinishing() || !url.equals(view.getTag())) return;
                    view.setImageBitmap(result);
                    view.setVisibility(View.VISIBLE);
                });
            });
        }
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
