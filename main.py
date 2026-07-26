import tkinter as tk
from tkinter import ttk, messagebox, simpledialog, filedialog
import threading
import os
from database import get_all_schools, get_unique_departamentos, init_db, get_config, set_config, update_status
from padron import import_padron_to_db

class App:
    def __init__(self, root):
        self.root = root
        self.root.title("CRM Docente - Gestión de Postulaciones")
        self.root.geometry("1100x600")
        
        init_db()
        self.create_menu()
        self.create_widgets()
        self.refresh_table()

    def create_menu(self):
        menubar = tk.Menu(self.root)
        
        # Menú Configuración
        config_menu = tk.Menu(menubar, tearoff=0)
        config_menu.add_command(label="Ajustes de Envío y Credenciales", command=self.open_settings)
        config_menu.add_command(label="Directorios de Confianza (Fuentes Secundarias)", command=self.open_sources_config)
        menubar.add_cascade(label="Configuración", menu=config_menu)
        
        # Menú Ayuda
        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="Cómo obtener clave de Gmail", command=self.open_help)
        menubar.add_cascade(label="Ayuda", menu=help_menu)
        
        self.root.config(menu=menubar)

    def open_help(self):
        help_text = (
            "Para poder enviar correos de forma automática, Gmail exige una 'Contraseña de Aplicación'.\n\n"
            "Pasos para obtenerla:\n"
            "1. Ve a tu cuenta de Google (myaccount.google.com).\n"
            "2. En el panel izquierdo, haz clic en 'Seguridad'.\n"
            "3. Asegúrate de tener activada la 'Verificación en dos pasos'.\n"
            "4. En el buscador de ajustes escribe 'Contraseñas de aplicación'.\n"
            "5. Ponle un nombre (ej. 'Buscador de Colegios') y dale a Crear.\n"
            "6. Copia las 16 letras amarillas y pégalas en los Ajustes de este programa."
        )
        messagebox.showinfo("Ayuda - Credenciales de Gmail", help_text)

    def open_sources_config(self):
        win = tk.Toplevel(self.root)
        win.title("Directorios de Confianza (Bases Secundarias)")
        win.geometry("650x450")
        win.grab_set()
        
        tk.Label(win, text="Estos dominios se usarán en la Etapa 1 del Cazador Web:", font=("Helvetica", 10, "bold")).pack(pady=10)
        
        # Add frame
        add_frame = tk.Frame(win)
        add_frame.pack(fill=tk.X, padx=20, pady=5)
        
        tk.Label(add_frame, text="Nueva Fuente (URL):").pack(side=tk.LEFT, padx=(0, 5))
        
        # We will pack the button FIRST so it claims its space on the right,
        # but we need to define the command later, so we create the button here
        btn_add = ttk.Button(add_frame, text="Agregar")
        btn_add.pack(side=tk.RIGHT, padx=5)
        
        v_new_url = tk.StringVar(win)
        entry_url = ttk.Entry(add_frame, textvariable=v_new_url)
        entry_url.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        
        # Treeview
        columns = ("Estado", "URL")
        tree = ttk.Treeview(win, columns=columns, show="headings", height=12)
        tree.heading("Estado", text="Estado")
        tree.column("Estado", width=120, anchor=tk.CENTER)
        tree.heading("URL", text="URL")
        tree.column("URL", width=450)
        tree.pack(padx=20, pady=10, fill=tk.BOTH, expand=True)
        
        from database import get_all_fuentes, add_fuente, remove_fuente
        import urllib.request, ssl, threading
        
        def validar_fuente(url):
            if not url.startswith("http"):
                test_url = "https://" + url
            else:
                test_url = url
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                req = urllib.request.Request(test_url, headers={'User-Agent': 'Mozilla/5.0'})
                urllib.request.urlopen(req, context=ctx, timeout=4)
                return "✅ Conectado"
            except Exception:
                return "❌ Error"
                
        def load_sources():
            for item in tree.get_children():
                tree.delete(item)
            for f_id, url in get_all_fuentes():
                item_id = tree.insert("", tk.END, values=("⏳ Validando...", f"{f_id} - {url}"))
                def validate_task(item, check_url):
                    status = validar_fuente(check_url)
                    try:
                        win.after(0, lambda: tree.set(item, "Estado", status))
                    except:
                        pass
                threading.Thread(target=validate_task, args=(item_id, url), daemon=True).start()
                
        def on_add():
            raw_url = v_new_url.get().strip()
            if not raw_url: return
            url = raw_url.replace("http://", "").replace("https://", "").split("/")[0]
            if url:
                add_fuente(url)
                v_new_url.set("")
                load_sources()
                
        btn_add.config(command=on_add)

        def on_delete():
            selection = tree.selection()
            if selection:
                val = tree.item(selection[0], "values")[1]
                f_id = val.split(" - ")[0]
                remove_fuente(int(f_id))
                load_sources()
                
        ttk.Button(win, text="Eliminar Seleccionada", command=on_delete).pack(pady=10)
        
        load_sources()
        
        load_sources()

    def open_settings(self):
        settings_win = tk.Toplevel(self.root)
        settings_win.title("Ajustes de Envío y Credenciales")
        settings_win.geometry("600x550")
        settings_win.grab_set() # Focus lock
        
        # Variables
        v_email = tk.StringVar(value=get_config("email", ""))
        v_pass = tk.StringVar(value=get_config("password", ""))
        v_cv = tk.StringVar(value=get_config("cv_path", ""))
        v_subj = tk.StringVar(value=get_config("subject", "Postulación espontánea - CV"))
        
        default_body = (
            "Estimados directivos,\n\n"
            "Me dirijo a ustedes con el propósito de acercarles mi Currículum Vitae para ser considerado "
            "en futuras búsquedas laborales dentro de su institución.\n\n"
            "Adjunto a este correo encontrarán mi CV con el detalle de mi formación y experiencia.\n\n"
            "Quedo a su entera disposición para ampliar cualquier información en una entrevista personal.\n\n"
            "Atentamente,"
        )
        saved_body = get_config("body", default_body)
        
        # Layout
        tk.Label(settings_win, text="1. Credenciales de Gmail", font=("Helvetica", 10, "bold")).pack(anchor="w", padx=10, pady=(10, 0))
        
        f_cred = tk.Frame(settings_win)
        f_cred.pack(fill=tk.X, padx=20, pady=5)
        tk.Label(f_cred, text="Tu Email de Gmail:", width=15, anchor="w").grid(row=0, column=0, pady=5)
        tk.Entry(f_cred, textvariable=v_email, width=40).grid(row=0, column=1)
        
        tk.Label(f_cred, text="Contraseña (16 letras):", width=15, anchor="w").grid(row=1, column=0, pady=5)
        tk.Entry(f_cred, textvariable=v_pass, width=40, show="*").grid(row=1, column=1)
        
        tk.Label(settings_win, text="2. Archivo Adjunto (Tu CV)", font=("Helvetica", 10, "bold")).pack(anchor="w", padx=10, pady=(15, 0))
        
        f_cv = tk.Frame(settings_win)
        f_cv.pack(fill=tk.X, padx=20, pady=5)
        tk.Entry(f_cv, textvariable=v_cv, width=50, state="readonly").pack(side=tk.LEFT, padx=(0,10))
        
        def browse_cv():
            filepath = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
            if filepath:
                v_cv.set(filepath)
                
        tk.Button(f_cv, text="Examinar...", command=browse_cv).pack(side=tk.LEFT)
        
        tk.Label(settings_win, text="3. Asunto y Cuerpo del Mensaje", font=("Helvetica", 10, "bold")).pack(anchor="w", padx=10, pady=(15, 0))
        
        f_msg = tk.Frame(settings_win)
        f_msg.pack(fill=tk.BOTH, expand=True, padx=20, pady=5)
        tk.Label(f_msg, text="Asunto:", width=10, anchor="w").grid(row=0, column=0, pady=5, sticky="w")
        tk.Entry(f_msg, textvariable=v_subj, width=50).grid(row=0, column=1, pady=5, sticky="w")
        
        tk.Label(f_msg, text="Mensaje:").grid(row=1, column=0, pady=5, sticky="nw")
        txt_body = tk.Text(f_msg, width=50, height=10)
        txt_body.grid(row=1, column=1, pady=5, sticky="w")
        txt_body.insert("1.0", saved_body)
        
        def save_all():
            set_config("email", v_email.get().strip())
            set_config("password", v_pass.get().strip())
            set_config("cv_path", v_cv.get().strip())
            set_config("subject", v_subj.get().strip())
            set_config("body", txt_body.get("1.0", tk.END).strip())
            
            messagebox.showinfo("Guardado", "Ajustes guardados correctamente en la base de datos.", parent=settings_win)
            settings_win.destroy()
            
        tk.Button(settings_win, text="Guardar Ajustes", command=save_all, bg="#4CAF50", fg="white", font=("Helvetica", 10, "bold")).pack(pady=15)

    def on_tree_double_click(self, event):
        item = self.tree.selection()
        if not item: return
        
        values = self.tree.item(item[0], "values")
        school_id = values[0]
        estado = values[5]
        
        if estado not in ("Rebotado", "Inubicable"):
            messagebox.showinfo("Información", "Solo se permite la edición manual para colegios en estado Rebotado o Inubicable.")
            return
            
        new_email = simpledialog.askstring("Edición Manual", f"Ingresa el nuevo correo para:\n{values[1]}", parent=self.root)
        if new_email and new_email.strip():
            from database import update_email
            update_email(school_id, new_email.strip())
            self.refresh_table()
            messagebox.showinfo("Actualizado", "El correo ha sido guardado y el estado cambió a Actualizado (Amarillo).")

    def create_widgets(self):
        # Top toolbar
        toolbar = tk.Frame(self.root, pady=10, padx=10)
        toolbar.pack(fill=tk.X)
        
        self.btn_import = tk.Button(toolbar, text="Importar Padrón Nacional", command=self.import_padron)
        self.btn_import.pack(side=tk.LEFT, padx=5)

        tk.Label(toolbar, text="Filtrar por Partido:").pack(side=tk.LEFT, padx=(20, 5))
        self.filter_var = tk.StringVar()
        self.combo_filter = ttk.Combobox(toolbar, textvariable=self.filter_var, state="readonly", width=25)
        self.combo_filter.pack(side=tk.LEFT)
        self.combo_filter.bind("<<ComboboxSelected>>", lambda e: self.refresh_table())

        tk.Label(toolbar, text="Estado:").pack(side=tk.LEFT, padx=(15, 5))
        self.status_filter_var = tk.StringVar()
        self.combo_status = ttk.Combobox(toolbar, textvariable=self.status_filter_var, state="readonly", width=15)
        self.combo_status.pack(side=tk.LEFT)
        self.combo_status['values'] = ["Todos", "Pendiente", "Enviado", "Rebotado", "Actualizado", "Inubicable"]
        self.combo_status.set("Todos")
        self.combo_status.bind("<<ComboboxSelected>>", lambda e: self.refresh_table())

        self.btn_refresh = tk.Button(toolbar, text="Refrescar Vista", command=self.refresh_table)
        self.btn_refresh.pack(side=tk.LEFT, padx=15)

        # Table
        columns = ("ID", "Colegio", "Departamento", "Localidad", "Email", "Estado", "Origen")
        self.tree = ttk.Treeview(self.root, columns=columns, show="headings", height=15, selectmode="extended")
        
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=100)
            
        self.tree.column("ID", width=40, anchor=tk.CENTER)
        self.tree.column("Colegio", width=250)
        self.tree.column("Departamento", width=150)
        self.tree.column("Localidad", width=150)
        self.tree.column("Email", width=250)
        self.tree.column("Estado", width=100, anchor=tk.CENTER)
        self.tree.column("Origen", width=120)
        
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Tags para colores
        self.tree.tag_configure('Pendiente', background='#ffffe0')
        self.tree.tag_configure('Actualizado', background='#fffacd') 
        self.tree.tag_configure('Enviado', background='#e0ffe0')
        self.tree.tag_configure('Rebotado', background='#ffe0e0')
        self.tree.tag_configure('Inubicable', background='#e0e0e0')
        
        self.tree.bind("<Double-1>", self.on_tree_double_click) # Azul
        
        scrollbar = tk.Scrollbar(self.root, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10)

        # Bottom Actions
        action_frame = tk.Frame(self.root, pady=10, padx=10)
        action_frame.pack(fill=tk.X)
        
        self.btn_send = tk.Button(action_frame, text="Enviar CV a Seleccionados", command=self.start_mailing, bg="#4CAF50", fg="white", font=("Helvetica", 10, "bold"))
        self.btn_send.pack(side=tk.LEFT, padx=5)

        self.btn_verify = tk.Button(action_frame, text="Verificar Rebotes en Gmail", command=self.verify_bounces, bg="#FF9800", fg="white", font=("Helvetica", 10, "bold"))
        self.btn_verify.pack(side=tk.LEFT, padx=5)
        
        self.btn_hunt = tk.Button(action_frame, text="Cazador Web (Buscar Rebotados)", command=self.hunt_emails, state=tk.NORMAL, bg="#2196F3", fg="white", font=("Helvetica", 10, "bold"))
        self.btn_hunt.pack(side=tk.LEFT, padx=5)

        self.status_var = tk.StringVar()
        self.status_var.set("Listo.")
        tk.Label(self.root, textvariable=self.status_var, fg="blue").pack(pady=5)

    def import_padron(self):
        if not messagebox.askyesno("Confirmar", "Esto borrará la base de datos actual y cargará el padrón desde cero. ¿Continuar?"):
            return
        
        self.status_var.set("Importando padrón... Por favor espera (esto tomará unos 10 segundos).")
        self.btn_import.config(state=tk.DISABLED)
        
        def task():
            success, count = import_padron_to_db()
            if success:
                self.root.after(0, lambda: self.status_var.set(f"¡Importación exitosa! {count} colegios cargados."))
                self.root.after(0, self.refresh_table)
            else:
                self.root.after(0, lambda: messagebox.showerror("Error", f"Fallo al importar: {count}"))
            self.root.after(0, lambda: self.btn_import.config(state=tk.NORMAL))
            
        threading.Thread(target=task, daemon=True).start()

    def refresh_table(self):
        deps = get_unique_departamentos()
        current_filter = self.filter_var.get()
        
        self.combo_filter['values'] = ["Todos"] + deps
        if not current_filter:
            self.combo_filter.set("Todos")
        
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        f_dep = self.filter_var.get()
        f_stat = self.status_filter_var.get()
        
        db_dep = None if f_dep in ("Todos", "") else f_dep
        db_stat = None if f_stat in ("Todos", "") else f_stat
            
        schools = get_all_schools(db_dep, db_stat)
        for s in schools:
            # s = (0:id, 1:nombre, 2:departamento, 3:localidad, 4:direccion, 5:telefono, 6:email, 7:estado, 8:origen)
            tag = s[7] # estado
            if tag not in ('Pendiente', 'Enviado', 'Rebotado'):
                if "Actualizado" in tag:
                    tag = "Actualizado"
                else:
                    tag = "Pendiente"
            
            # Map DB columns to Treeview columns: ("ID", "Colegio", "Departamento", "Localidad", "Email", "Estado", "Origen")
            row_values = (s[0], s[1], s[2], s[3], s[6], s[7], s[8])
            self.tree.insert("", tk.END, values=row_values, tags=(tag,))
            
        self.status_var.set(f"Mostrando {len(schools)} colegios.")

    def start_mailing(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showwarning("Atención", "Seleccioná al menos un colegio en la tabla para enviar tu CV.")
            return
            
        c_email = get_config("email")
        c_pass = get_config("password")
        c_cv = get_config("cv_path")
        c_subj = get_config("subject")
        c_body = get_config("body")
        
        if not c_email or not c_pass or not c_cv or not c_subj or not c_body:
            messagebox.showerror("Error de Configuración", "Faltan configurar tus ajustes de envío.\nVe al menú 'Configuración -> Ajustes de Envío y Credenciales' y completa todos los campos.")
            return
            
        if not os.path.exists(c_cv):
            messagebox.showerror("Error de Archivo", f"No se pudo encontrar el CV en la ruta:\n{c_cv}\nPor favor, ve a Configuración y vuelve a seleccionarlo.")
            return
            
        selected_schools = []
        for item in selected_items:
            values = self.tree.item(item, "values")
            school_id = values[0]
            school_name = values[1]
            email = values[4]
            selected_schools.append((school_id, email, school_name))
        
        if not messagebox.askyesno("Confirmar", f"Se van a intentar enviar correos a {len(selected_schools)} colegios seleccionados.\n¿Estás seguro?"):
            return
            
        self.btn_send.config(state=tk.DISABLED)
        self.status_var.set(f"Enviando {len(selected_schools)} correos... (esto puede tardar, no cierres la ventana)")
        
        def task():
            from mailer import send_emails
            
            def update_progress(text):
                self.root.after(0, lambda: self.status_var.set(text))
                
            success, msg, success_ids, failed_ids = send_emails(
                (c_email, c_pass), 
                selected_schools, 
                c_cv, 
                c_subj, 
                c_body, 
                progress_callback=update_progress
            )
            
            for sid in success_ids:
                update_status(sid, "Enviado")
                
            self.root.after(0, self.refresh_table)
            
            if not success:
                self.root.after(0, lambda: messagebox.showerror("Error", msg))
            else:
                if failed_ids:
                    first_error = failed_ids[0][1]
                    msg += f"\n\nCausa del primer error:\n{first_error}"
                self.root.after(0, lambda: messagebox.showinfo("Resultado", msg))
                
            self.root.after(0, lambda: self.status_var.set("Envío de correos finalizado."))
            self.root.after(0, lambda: self.btn_send.config(state=tk.NORMAL))
            
        threading.Thread(target=task, daemon=True).start()

    def verify_bounces(self):
        c_email = get_config("email")
        c_pass = get_config("password")
        
        if not c_email or not c_pass:
            messagebox.showerror("Error de Configuración", "Faltan configurar tus credenciales.\nVe al menú 'Configuración -> Ajustes de Envío y Credenciales' y completa tu correo y clave.")
            return
        
        self.btn_verify.config(state=tk.DISABLED)
        self.status_var.set("Buscando correos rebotados en Gmail... (puede tardar un momento)")
        
        def task():
            from bounce_checker import get_bounced_emails
            import re
            
            # Buscamos rebotes en los últimos 30 días para ser más exhaustivos
            success, msg, bounced_list = get_bounced_emails((c_email, c_pass), days_back=30)
            if not success:
                self.root.after(0, lambda: messagebox.showerror("Error", msg))
            else:
                if bounced_list:
                    count = 0
                    schools = get_all_schools()
                    for s in schools:
                        db_email_cell = str(s[6]).lower().strip()
                        if db_email_cell:
                            # Extraemos todos los emails individuales de la celda de la base de datos
                            db_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', db_email_cell)
                            # Si alguno de los emails de este colegio rebotó, marcamos todo el colegio como Rebotado
                            if any(email.lower().strip() in bounced_list for email in db_emails):
                                update_status(s[0], "Rebotado")
                                count += 1
                            
                    self.root.after(0, self.refresh_table)
                    self.root.after(0, lambda: messagebox.showinfo("Resultado", f"{msg}\nSe marcaron {count} escuelas como 'Rebotado' en la base de datos."))
                else:
                    self.root.after(0, lambda: messagebox.showinfo("Resultado", "No se encontraron correos rebotados recientes."))
                    
            self.root.after(0, lambda: self.status_var.set("Verificación de rebotes finalizada."))
            self.root.after(0, lambda: self.btn_verify.config(state=tk.NORMAL))
            
        threading.Thread(target=task, daemon=True).start()

    def hunt_emails(self):
        if not messagebox.askyesno("Confirmar", "Esto buscará en internet los correos rebotados para intentar encontrar uno nuevo.\n\nAtención: Este proceso tomará varios minutos dependiendo de la cantidad de rebotes.\n\n¿Deseas iniciar el Cazador Web?"):
            return
            
        self.btn_hunt.config(state=tk.DISABLED)
        self.status_var.set("Cazador Web buscando correos nuevos en internet... (Por favor espera)")
        
        def task():
            from email_hunter import hunt_for_emails
            success, msg, count = hunt_for_emails()
            
            self.root.after(0, self.refresh_table)
            
            if not success:
                self.root.after(0, lambda: messagebox.showerror("Error", msg))
            else:
                self.root.after(0, lambda: messagebox.showinfo("Resultado", msg))
                
            self.root.after(0, lambda: self.status_var.set("Cazador Web finalizado."))
            self.root.after(0, lambda: self.btn_hunt.config(state=tk.NORMAL))
            
        threading.Thread(target=task, daemon=True).start()

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()
