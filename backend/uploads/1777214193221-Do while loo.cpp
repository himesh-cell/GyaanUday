// create a prgm to run the loop till the input is yes and when the input is no then exit the loop

#include <iostream>
#include <string>
using namespace std;
int main (){
    string response;
    do{
        cout << "Do you want more tea (yes/no): ";
        getline(cin,response);

    }while(response == "yes");
    return 0;
}