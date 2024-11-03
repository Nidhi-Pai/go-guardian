"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, User, Phone, Mail, Heart } from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

const relationships = ['Family', 'Friend', 'Colleague', 'Neighbor', 'Other'];

const relationshipColors = {
  'Family': 'bg-red-100 text-red-800',
  'Friend': 'bg-blue-100 text-blue-800',
  'Colleague': 'bg-green-100 text-green-800',
  'Neighbor': 'bg-purple-100 text-purple-800',
  'Other': 'bg-gray-100 text-gray-800'
};

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = React.useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '+1 (555) 123-4567', 
      email: 'john.doe@example.com',
      relationship: 'Family',
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+1 (555) 987-6543',
      email: 'jane.smith@example.com',
      relationship: 'Friend',
    },
    {
      id: '3', 
      name: 'Robert Johnson',
      phone: '+1 (555) 246-8135',
      email: 'robert.j@example.com',
      relationship: 'Colleague',
    },
    {
      id: '4',
      name: 'Sarah Williams',
      phone: '+1 (555) 369-1470',
      email: 'sarah.w@example.com',
      relationship: 'Neighbor',
    },
    {
      id: '5',
      name: 'Michael Brown',
      phone: '+1 (555) 159-7530',
      email: 'michael.b@example.com',
      relationship: 'Family',
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<EmergencyContact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [contactToDelete, setContactToDelete] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      relationship: '',
    },
  });

  const handleAddClick = () => {
    setSelectedContact(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditClick = (contact: EmergencyContact) => {
    setSelectedContact(contact);
    form.reset({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      relationship: contact.relationship,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (contactId: string) => {
    setContactToDelete(contactId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      setContacts(contacts.filter(c => c.id !== contactToDelete));
      toast({
        title: "Contact deleted",
        description: "Emergency contact has been removed successfully.",
      });
    }
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const onSubmit = (data: any) => {
    if (selectedContact) {
      setContacts(contacts.map(contact =>
        contact.id === selectedContact.id
          ? { ...contact, ...data }
          : contact
      ));
      toast({
        title: "Contact updated",
        description: "Emergency contact has been updated successfully.",
      });
    } else {
      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        ...data,
      };
      setContacts([...contacts, newContact]);
      toast({
        title: "Contact added", 
        description: "New emergency contact has been added successfully.",
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Emergency Contacts</h1>
          <p className="text-muted-foreground">Keep your trusted contacts close</p>
        </div>
        <Button onClick={handleAddClick} size="sm" className="hover:scale-105 transition-transform">
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          {contacts.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div>
                <p className="text-lg font-medium">No emergency contacts yet</p>
                <p className="text-sm text-muted-foreground">
                  Click the Add Contact button to add your first contact
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {contacts.map((contact, index) => (
                <div key={contact.id} className="group">
                  <div className="flex items-start justify-between rounded-lg p-2 group-hover:bg-muted/50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium leading-none mb-2">{contact.name}</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-primary" />
                            {contact.phone}
                          </div>
                          {contact.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-primary" />
                              {contact.email}
                            </div>
                          )}
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${relationshipColors[contact.relationship as keyof typeof relationshipColors]}`}>
                            {contact.relationship}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(contact)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(contact.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {index < contacts.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContact ? (
                <>
                  <Pencil className="h-5 w-5" />
                  Edit Contact
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add New Contact
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact name" {...field} className="focus-visible:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} className="focus-visible:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} className="focus-visible:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-primary">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationships.map((rel) => (
                          <SelectItem key={rel} value={rel} className={`focus:${relationshipColors[rel as keyof typeof relationshipColors]}`}>
                            {rel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {selectedContact ? 'Save Changes' : 'Add Contact'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Contact
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this emergency contact?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}