using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;
namespace GUI_Opensees
{
    public partial class Form1 : System.Windows.Forms.Form
    {
        //user defined parameters
        private int Stories=-1;
        /*not used currently*/private List<double> Story_value_arr = new List<double>();//List which will have all the values of the created stories, added through keydowneventfunction
        private List<TextBox> Story_arr = new List<TextBox>();//has all the objects created. To set their enabled prop.
        private int modelNo = -1;//if stays -1, error in assignment
        private string forceunit, lengthunit, timeunit;//set to null
        /*is used instead*/private List<double> Story_value_arr_2 = new List<double>();
        private List<Label> Label_story_arr = new List<Label>();
        private bool once_click_model = false;//for modelinput click(to not be as annoying)
        private int[] other_nodes = { 0, 0, 0, 0, 0, 0 };

        public Form1()//constructor
        {
            InitializeComponent();
        }

        



    }//end of class

}//end of namespace
