import PySimpleGUI as sg

layout = [
    [sg.Text('Welcome to VigilanceHub!', size=(20, 1), font=('Arial', 20), justification='center')],
    [sg.Button('Exit', button_color='red')]
]

window = sg.Window('VigilanceHub', layout, resizable=True, element_justification='center')

while True:
    event, values = window.read()

    if event == sg.WIN_CLOSED or event == 'Exit':
        break

window.close()
