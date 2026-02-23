import tkinter as tk
import customtkinter as ctk
from tkcalendar import Calendar
from datetime import datetime, timedelta, date
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import holidays
from collections import defaultdict
import json
import os
import appdirs  # This will help us get the AppData directory
from storage import (
    save_hours,
    load_hours,
    save_calendar_events,
    load_calendar_events
)
# Data sets
zile_prezente = set()
zile_concediu = set()
zile_wfh = set()
overtime_data = defaultdict(int)
permission_data = defaultdict(int)

# Get AppData directory
app_name = "Personal Activity Calendar"
app_author = "Aumovio"
data_dir = appdirs.user_data_dir(app_name, app_author)

# Create directory if it doesn't exist
os.makedirs(data_dir, exist_ok=True)

# File paths
FILE_ORE = os.path.join(data_dir, "ore_data.txt")
FILE_CALENDAR = os.path.join(data_dir, "calendar_data.txt")

# CustomTkinter setup
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")
app = ctk.CTk()
app.title(" Personal Activity Calendar")
app.geometry("1200x800")
app.resizable(False, False)  # Dezactivează redimensionarea pe orizontală și verticală
tip_zi = tk.StringVar(value="Prezență")
selected_year = tk.IntVar(value=datetime.now().year)

def get_ro_holidays():
    current_year = datetime.now().year
    years = range(current_year - 2, current_year + 3)
    return holidays.RO(years=years)

def get_current_calendar_month():
    # Obține data afișată din header-ul calendarului
    header_text = cal._date.strftime("%Y-%m")  # Format "YYYY-MM"
    year, month = map(int, header_text.split('-'))
    return date(year, month, 1)

def mark_all_holidays():
    ro_holidays = get_ro_holidays()
    for holiday_date in ro_holidays:
        cal.calevent_create(holiday_date, "holiday", "holiday")

def load_marked_days():
    """Reîncarcă toate zilele marcate în calendar"""
    for day in zile_prezente:
        cal.calevent_create(day, "prezenta", "prezenta")
    for day in zile_concediu:
        cal.calevent_create(day, "concediu", "concediu")
    for day in zile_wfh:
        cal.calevent_create(day, "wfh", "wfh")

def update_calendar_events():
    """Actualizează afișarea evenimentelor în calendar cu culori diferite"""
    # Ștergem toate evenimentele existente
    for event in cal.get_calevents():
        cal.calevent_remove(event)
    
    # Adăugăm sărbătorile (cu culoare specifică)
    ro_holidays = get_ro_holidays()
    for holiday_date in ro_holidays:
        cal.calevent_create(holiday_date, "Sărbătoare", "holiday")
    
    # Adăugăm zilele marcate cu culori specifice
    for day in zile_prezente:
        cal.calevent_create(day, "Prezență", "present")
    for day in zile_concediu:
        cal.calevent_create(day, "Concediu", "vacation")
    for day in zile_wfh:
        cal.calevent_create(day, "Work From Home", "wfh")
    
    # Configurăm culorile pentru fiecare tip de eveniment
    cal.tag_config("present", background="#2aa745", foreground="white")  # Verde
    cal.tag_config("vacation", background="#ff9500", foreground="black")  # Portocaliu
    cal.tag_config("wfh", background="#1a73e8", foreground="white")  # Albastru
    cal.tag_config("holiday", background="#5f6368", foreground="white")  # Gri

def show_monthly_chart():
    update_calendar_events()
    for widget in frame_chart.winfo_children():
        if not isinstance(widget, ctk.CTkLabel):
            widget.destroy()

    first_day = get_current_calendar_month()
    next_month = (first_day.replace(day=28) + timedelta(days=4)).replace(day=1)
    last_day = next_month - timedelta(days=1)
    ro_holidays = get_ro_holidays()
    
    # Calculate all working days (excluding weekends and holidays)
    all_working_days = [
        day for day in (first_day + timedelta(days=i) for i in range((last_day - first_day).days + 1))
        if day.weekday() < 5 and day not in ro_holidays
    ]
    total_available_days = len(all_working_days)

    # Get marked days
    vacation_days_month = [day for day in zile_concediu if first_day <= day <= last_day]
    present_days_month = [day for day in zile_prezente if first_day <= day <= last_day]
    wfh_days_month = [day for day in zile_wfh if first_day <= day <= last_day]
    
    # Calculate actual presence (excluding vacation days)
    office_present = len([day for day in present_days_month if day not in vacation_days_month])
    wfh = len([day for day in wfh_days_month if day not in vacation_days_month])
    vacations = len(vacation_days_month)
    
    # Unmarked days are considered not present
    unmarked_days = total_available_days - (office_present + wfh + vacations)

    # Calculate percentages against total available days
    labels = ["Office", "WFH", "Vacation", "Not Present"]
    sizes = [
        office_present,
        wfh,
        vacations,
        unmarked_days
    ]
    colors = ["#2aa745", "#1a73e8", "#ff9500", "#f0f0f0"]
    
    # Only show categories with values > 0
    filtered_labels = []
    filtered_sizes = []
    filtered_colors = []
    for label, size, color in zip(labels, sizes, colors):
        if size > 0:
            filtered_labels.append(label)
            filtered_sizes.append(size)
            filtered_colors.append(color)

    fig, ax = plt.subplots(figsize=(3, 2))  # Slightly larger figure
    
    if filtered_sizes:
        # Custom autopct to show both count and percentage
        def make_autopct(values):
            def my_autopct(pct):
                total = sum(values)
                val = int(round(pct*total/100.0))
                return f'{pct:.1f}%'
            return my_autopct
            
        ax.pie(filtered_sizes, labels=filtered_labels, colors=filtered_colors,
               autopct=make_autopct(filtered_sizes), startangle=90, 
               wedgeprops={'linewidth': 0.5, 'edgecolor': 'w'})
        ax.axis('equal')
        ax.set_title(f"{first_day.strftime('%B %Y')}\nTotal Available: {total_available_days -vacations} days", 
                   fontweight='bold', pad=10, fontsize=10)
    else:
        ax.text(0.5, 0.5, 'No data available', 
               horizontalalignment='center',
               verticalalignment='center',
               transform=ax.transAxes)
        ax.set_title(f"{first_day.strftime('%B %Y')}", 
                   fontweight='bold', pad=20, fontsize=10)
        ax.axis('off')
    
    canvas = FigureCanvasTkAgg(fig, master=frame_chart)
    canvas.draw()
    canvas.get_tk_widget().pack(fill='both', expand=True)

    # Update stats label
    presence_text = f"Office Days Presence: {office_present}/{total_available_days - vacations} [{office_present/(total_available_days - vacations)*100:.1f}%]       "
    stats_label.configure(text=presence_text)

    # Modified to show ratio of office days to total days
    ot_section_text = f"-------------------------------------Overtime/LP section-------------------------------------"
    ot_label.configure(text=ot_section_text)

    presence_section_text = f"-------------------------------------Presence Section------------------------------------"
    presence_label.configure(text=presence_section_text)
def show_yearly_hours():
    for widget in frame_hours_chart.winfo_children():
        widget.destroy()

    year = selected_year.get()
    total_overtime = sum(v for k, v in overtime_data.items() if k.year == year)
    total_permission = sum(v for k, v in permission_data.items() if k.year == year)
    balance = total_overtime - total_permission

    fig = plt.figure(figsize=(2, 2))  # Slightly larger figure to accommodate text
    gs = fig.add_gridspec(2, 1, height_ratios=[3, 1])  # Split into 2 rows (chart and text)
    ax1 = fig.add_subplot(gs[0])  # Top for pie chart
    ax2 = fig.add_subplot(gs[1])  # Bottom for text
    ax2.axis('off')  # Hide axes for text area

    # Prepare data for pie chart (only overtime and permission)
    labels = []
    sizes = []
    colors = []
    
    if total_overtime > 0:
        labels.append("Overtime")
        sizes.append(total_overtime)
        colors.append("#9c27b0")  # Purple
        
    if total_permission > 0:
        labels.append(" Leaving Permission")
        sizes.append(total_permission)
        colors.append("#ffc107")  # Amber
    
    if sizes:  # Only create pie chart if there's data to show
        wedges, texts, autotexts = ax1.pie(
            sizes, labels=labels, colors=colors,
            autopct='%1.1f%%', startangle=90,
            wedgeprops={'linewidth': 0},
            textprops={'color': 'white', 'fontsize': 8}
        )
        
        # Make the pie chart slightly smaller to leave space
        ax1.set_position([0.1, 0.2, 0.8, 0.8])
        ax1.axis('equal')  # Equal aspect ratio ensures the pie chart is circular
        ax1.set_title(f"Hours{year}", fontweight='bold', pad=10, fontsize=10, color='white')
        
        # Display numeric values below the chart
        info_text = ""
        if total_overtime > 0:
            info_text += f"Overtime: {total_overtime} Hours\n"
        if total_permission > 0:
            info_text += f"Permission: {total_permission} Hours\n"
        info_text += f"Balance: {balance} Hours"
        
        ax2.text(0.4, 0.4, info_text,
                ha='left', va='center',
                fontsize=10, color='black',
                bbox=dict(facecolor='white', edgecolor='none', pad=0))
    else:
        # Display a message if no data is available
        ax1.text(0.5, 0.5, 'No data available', 
                horizontalalignment='center',
                verticalalignment='center',
                transform=ax1.transAxes,
                color='white')
        ax1.set_title(f"Hours {year}", fontweight='bold', pad=20, fontsize=10)
        ax1.axis('off')
    
    canvas = FigureCanvasTkAgg(fig, master=frame_hours_chart)
    canvas.draw()
    canvas.get_tk_widget().pack(fill='both', expand=True)
# UI functions
def add_day():
    day = datetime.strptime(cal.get_date(), "%Y-%m-%d").date()
    day_type = tip_zi.get()
    
    # Ștergem orice marcaj existent pentru ziua respectivă
    zile_prezente.discard(day)
    zile_concediu.discard(day)
    zile_wfh.discard(day)
    cal.calevent_remove('all', day)
    
    # Adăugăm ziua în setul corespunzător
    if day_type == "Prezență":
        zile_prezente.add(day)
        cal.calevent_create(day, "Prezență", "present")
    elif day_type == "Concediu":
        zile_concediu.add(day)
        cal.calevent_create(day, "Concediu", "vacation")
    elif day_type == "WFH":
        zile_wfh.add(day)
        cal.calevent_create(day, "WFH", "wfh")
    
    update_calendar_events()
    show_monthly_chart()
    save_calendar_events(zile_prezente, zile_concediu, zile_wfh)  # Save after adding a day

def delete_day():
    day = datetime.strptime(cal.get_date(), "%Y-%m-%d").date()
    zile_prezente.discard(day)
    zile_concediu.discard(day)
    zile_wfh.discard(day)
    cal.calevent_remove('all', day)
    show_monthly_chart()
    save_calendar_events(zile_prezente, zile_concediu, zile_wfh)  # Save after deleting a day

def clear_hours():
    # Golește complet ambele dicționare
    overtime_data.clear()
    permission_data.clear()

    # Salvăm modificările
    save_hours(overtime_data, permission_data)

    # Reîmprospătăm graficul
    show_yearly_hours()

    # Golităm câmpurile
    overtime_entry.delete(0, tk.END)
    permission_entry.delete(0, tk.END)

    # Actualizăm interfața
    app.update_idletasks()

def delete_month():
    first_day = get_current_calendar_month()
    last_day = (first_day.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    for day in range((last_day - first_day).days + 1):
        date = first_day + timedelta(days=day)
        zile_prezente.discard(date)
        zile_concediu.discard(date)
        zile_wfh.discard(date)
        cal.calevent_remove('all', date)
    show_monthly_chart()
    save_calendar_events(zile_prezente, zile_concediu, zile_wfh)  # Save after deleting a month

def on_month_change(event=None):
    try:
        # Actualizează graficul pentru luna afișată
        show_monthly_chart()
    except Exception as e:
        print(f"Error in on_month_change: {e}")

def add_hours():
    day = datetime.strptime(cal.get_date(), "%Y-%m-%d").date()
    try:
        overtime = float(overtime_entry.get())
        overtime_data[day] = overtime
    except ValueError:
        pass
    try:
        permission = float(permission_entry.get())
        permission_data[day] = permission
    except ValueError:
        pass
    overtime_entry.delete(0, tk.END)
    permission_entry.delete(0, tk.END)
    save_hours(overtime_data, permission_data)
    show_yearly_hours()

def check_month_change():
    try:
        current_month_year = cal._date.strftime("%Y-%m")  # "YYYY-MM"
        
        if not hasattr(check_month_change, 'last_checked'):
            check_month_change.last_checked = current_month_year
        
        if current_month_year != check_month_change.last_checked:
            check_month_change.last_checked = current_month_year
            on_month_change()
    except Exception as e:
        print(f"Error in check_month_change: {e}")

def update_year(*args):
    show_yearly_hours()

# Main layout
main_frame = ctk.CTkFrame(app)
main_frame.pack(fill="both", expand=True, padx=10, pady=10)

# Left panel - Calendar and controls
left_panel = ctk.CTkFrame(main_frame)
left_panel.pack(side="left", fill="y", padx=(0, 10), pady=10)

# Calendar
calendar_frame = ctk.CTkFrame(left_panel)
calendar_frame.pack(pady=(0, 10))
cal = Calendar(
    calendar_frame,
    selectmode="day",
    date_pattern="yyyy-mm-dd",
    font="Arial 14",
    showweeknumbers=False,
    background='#f0f0f0',
    foreground='black',
    headersbackground='#d0d0d0',
    normalbackground='#ffffff',
    weekendbackground='#f8f8f8',
    bordercolor='#c0c0c0',
    selectbackground='#1f6aa5',
    selectforeground='white'
)

cal.tag_config("present", background="#2aa745", foreground="white")
cal.tag_config("vacation", background="#ff9500", foreground="black")
cal.tag_config("wfh", background="#1a73e8", foreground="white")
cal.tag_config("holiday", background="#5f6368", foreground="white")
cal.pack(padx=5, pady=5)
# Controls
controls_frame = ctk.CTkFrame(left_panel)
controls_frame.pack(fill="both", expand=True)

presence_label = ctk.CTkLabel(controls_frame, text="", font=("Impact", 16))
presence_label.pack(pady=5)

day_type_frame = ctk.CTkFrame(controls_frame)
day_type_frame.pack(pady=10, fill="x")


ctk.CTkLabel(day_type_frame, text="|Day Type|", font=("Arial", 14,"bold")).grid(row=0, column=0, padx=10)
ctk.CTkRadioButton(day_type_frame, text="Present", variable=tip_zi, value="Prezență").grid(row=0, column=1, padx=10)
ctk.CTkRadioButton(day_type_frame, text="Vacation", variable=tip_zi, value="Concediu").grid(row=0, column=2, padx=10)
ctk.CTkRadioButton(day_type_frame, text="WFH", variable=tip_zi, value="WFH").grid(row=0, column=3, padx=10)

# Action buttons
action_buttons_frame = ctk.CTkFrame(controls_frame)
action_buttons_frame.pack(pady=10, fill="x")

# Înlocuiește secțiunea cu butoanele cu această versiune
ctk.CTkButton(action_buttons_frame, text="Add day", command=add_day,font=("Palatino", 14, "bold"),  # Același font
             width=100, height=40, fg_color="green", hover_color="darkgreen").grid(row=0, column=0, padx=5, pady=5)
ctk.CTkButton(action_buttons_frame, text="Delete day", command=delete_day,font=("Palatino", 14, "bold"),  # Același font
             width=100, height=40, fg_color="crimson", hover_color="darkred").grid(row=0, column=1, padx=5, pady=5)
ctk.CTkButton(action_buttons_frame, text="Reset month", command=delete_month,font=("Palatino", 14, "bold"),
             width=100, height=40, fg_color="#0048ff", hover_color="#cc8400").grid(row=0, column=2, padx=5, pady=5)

# Configurează coloanele pentru centrare
action_buttons_frame.grid_columnconfigure(0, weight=1)
action_buttons_frame.grid_columnconfigure(1, weight=1)
action_buttons_frame.grid_columnconfigure(2, weight=1)

# Stats label
stats_label = ctk.CTkLabel(controls_frame, text="", font=("Impact", 18))
stats_label.pack(pady=50)

ot_label = ctk.CTkLabel(controls_frame, text="", font=("Impact", 16))
ot_label.pack(pady=5)

# Year selection and button - modified version
year_frame = ctk.CTkFrame(controls_frame)
year_frame.pack(pady=10, fill="x")

hours_frame = ctk.CTkFrame(controls_frame)
hours_frame.pack(pady=10, fill="x")


# Labels row
labels_row = ctk.CTkFrame(hours_frame)
labels_row.pack(fill="x")
ctk.CTkLabel(labels_row, text="Overtime", font=("Palatino", 12)).pack(side="left", padx=50, expand=True)
ctk.CTkLabel(labels_row, text="Leaving Permission", font=("Palatino", 12)).pack(side="left", padx=10, expand=True)
# Label
ctk.CTkLabel(year_frame, text="Year for OT Ballance", font=("Palatino", 14)).pack(side="left", padx=5)
# Entries row
entries_row = ctk.CTkFrame(hours_frame)
entries_row.pack(fill="x")
overtime_entry = ctk.CTkEntry(entries_row, width=80)
overtime_entry.pack(side="left", padx=10, expand=True)
permission_entry = ctk.CTkEntry(entries_row, width=80)
permission_entry.pack(side="left", padx=10, expand=True)
# Add this after the entries_row in the hours_frame section
clear_button_row = ctk.CTkFrame(hours_frame)
clear_button_row.pack(fill="x", pady=5)
ctk.CTkButton(clear_button_row, text="Clear Hours Records",font=("Palatino", 14,"bold"), command=clear_hours,
              width=120, height=30, fg_color="red", hover_color="#cc7700").pack(pady=5)

# Dropdown
year_spinbox = ctk.CTkOptionMenu(year_frame, variable=selected_year, 
                                values=[str(y) for y in range(2020, 2030)],
                                command=lambda _: update_year())
year_spinbox.pack(side="left", padx=5)

# Button - now packed in the same frame
ctk.CTkButton(year_frame, text="Add hours", command=add_hours,
              width=120, height=30).pack(side="left", padx=5)


# Right panel - Charts
right_panel = ctk.CTkFrame(main_frame)
right_panel.pack(side="right", fill="both", expand=True)

# Monthly attendance chart
frame_chart = ctk.CTkFrame(right_panel)
frame_chart.pack(side="top", fill="both", expand=True, padx=5, pady=10)
ctk.CTkLabel(frame_chart, text="Monthly Attendance", font=("Palatino", 16, "bold")).pack(pady=5)

# Yearly hours chart
frame_hours_chart = ctk.CTkFrame(right_panel)
frame_hours_chart.pack(side="bottom", fill="both", expand=True, padx=5, pady=5)
ctk.CTkLabel(frame_hours_chart, text="Annual Hours Balance", font=("Palatino", 16, "bold")).pack(pady=5)

# Load all data
load_hours(overtime_data, permission_data)
load_calendar_events(zile_prezente, zile_concediu, zile_wfh)
mark_all_holidays()
load_marked_days()
show_monthly_chart()
show_yearly_hours()

# Bind year change
selected_year.trace_add("write", lambda *args: update_year())
cal.bind("<<CalendarMonthChanged>>", on_month_change)

# Start the periodic check
check_month_change()

app.mainloop()