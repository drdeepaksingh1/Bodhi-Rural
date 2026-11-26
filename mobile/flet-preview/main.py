"""Bodhi Rural mobile interface preview for Flet."""
import flet as ft

SITE = "https://www.brlps.co.in"
GREEN = "#124531"
CREAM = "#FAF6EB"

MODULES = {
    "BodhiFarm": [
        ("Farmer", "किसान", "/login?redirect=%2Fbodhifarm"),
        ("Field Team", "फील्ड टीम", "/login?redirect=%2Fbodhifarm"),
        ("Management", "प्रबंधन", "/login?redirect=%2Fdashboard"),
    ],
    "BodhiMart": [
        ("Buyer", "खरीदार", "/login?account=buyer&redirect=%2Fbodhimart%2Fproducts"),
        ("Seller", "विक्रेता", "/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fdashboard"),
        ("Delivery Partner", "डिलीवरी पार्टनर", None),
    ],
}


def main(page: ft.Page):
    page.title = "Bodhi Rural"
    page.bgcolor = CREAM
    page.padding = 24
    page.scroll = ft.ScrollMode.AUTO
    language = "en"
    section = None
    role = None

    def label(english, hindi):
        return hindi if language == "hi" else english

    def navigate(module=None, selected_role=None):
        nonlocal section, role
        section, role = module, selected_role
        render()

    def select_language(value):
        nonlocal language
        language = value
        render()

    def link(english, hindi, path):
        return ft.TextButton(label(english, hindi), url=SITE + path)

    def render():
        controls = []
        if section:
            controls.append(ft.TextButton(label("Back", "वापस"),
                                          on_click=lambda _: navigate(section if role else None)))
        controls.extend([
            ft.Image(src=SITE + "/branding/bodhi-rural-logo.png", width=220, height=84),
            ft.Text(section or "Bodhi Rural", size=34, weight=ft.FontWeight.BOLD, color=GREEN),
            ft.Row([
                ft.TextButton("English", on_click=lambda _: select_language("en")),
                ft.TextButton("हिन्दी", on_click=lambda _: select_language("hi")),
            ], alignment=ft.MainAxisAlignment.CENTER),
        ])

        if not section:
            controls.extend(ft.FilledButton(name, height=64,
                                              on_click=lambda _, module=name: navigate(module))
                            for name in MODULES)
        elif not role:
            controls.append(ft.Text(label("Choose your sign-in", "लॉग इन का प्रकार चुनें"), size=22))
            controls.extend(ft.FilledButton(label(option[0], option[1]), height=56,
                                              on_click=lambda _, selected=option: navigate(section, selected))
                            for option in MODULES[section])
        else:
            english, hindi, path = role
            controls.append(ft.Text(label(english, hindi), size=24, weight=ft.FontWeight.BOLD))
            if path:
                controls.append(link("Sign in on Bodhi Rural", "बोधि रूरल पर लॉग इन करें", path))
            if english == "Buyer":
                controls.append(link("Browse products", "उत्पाद देखें", "/bodhimart/products"))
                controls.append(link("Create a buyer account", "खरीदार खाता बनाएँ", "/bodhimart/register"))
            elif english == "Seller":
                controls.append(link("Apply to sell", "विक्रेता बनने के लिए आवेदन करें", "/bodhimart/seller/register"))
                controls.append(link("Check application status", "आवेदन की स्थिति देखें", "/bodhimart/seller/status"))
            elif english == "Farmer":
                controls.append(link("Apply as a farmer", "किसान के रूप में आवेदन करें", "/farmer/register"))
            elif path is None:
                controls.append(ft.Text(label(
                    "Delivery partner sign-in is pending deployment.",
                    "डिलीवरी पार्टनर लॉग इन अभी लाइव नहीं है।",
                )))

        page.controls[:] = [ft.Column(controls, spacing=14, horizontal_alignment=ft.CrossAxisAlignment.CENTER)]
        page.update()

    render()


ft.run(main)
