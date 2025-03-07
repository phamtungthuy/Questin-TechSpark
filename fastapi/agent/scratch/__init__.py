import importlib

def component_class(class_name):
    m = importlib.import_module("agent.scratch.component")
    c = getattr(m, class_name)
    return c

if __name__ == '__main__':
    print(component_class("RetrievalParam")())