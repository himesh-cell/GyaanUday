// run the program till the value of given variable is iterable and print the message for iterable times

#include <iostream>
#include <string>
using namespace std;
int main(){
    int teaCups=5;
    
    for(int i=1 ; i<=teaCups ; i++){
        cout << "Brewing cup " << i << " of tea...." << endl; 
    }



    return 0;
}