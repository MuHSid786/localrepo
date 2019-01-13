using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace GUI_Opensees
{
    public partial class Form1 : System.Windows.Forms.Form
    {
        //base parameters
        private int[] base_node = { 0, 0, 0, 0, 0, 0 };
        private List<Control> BoucWen_controls= new List<Control>();
        private ComboBox Isolator_bearingoptions_control = new ComboBox();
        private List<TextBox> damper_lst = new List<TextBox>();
        
    }//end class
}//end namespace
